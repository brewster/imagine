"use strict";

var events = require('events');
var extend = require('obj-extend');
var http = require('http');
var https = require('https');
var url = require('url');
var winston = require('winston');
var statsd = require('./statsd');

var SourceDownloader = function (source) {
  this.source = source;
};

SourceDownloader.prototype = extend({}, events.EventEmitter.prototype, {

  // Simply start the request when we're ready to go
  handleResponse: function () {
    // Create request options from parsed source URL
    var options = url.parse(this.source, false);

    // Add on some defaults
    extend(options, {
      method: 'get',
      headers: {
        host: options.host,
        accept: 'image/*'
      }
    });

    // Determine https/http from source URL
    var library = options.protocol === 'https:' ? https : http;

    // Setup the request and its event binds
    this.request = library.request(options);
    this.request.on('response', this.onResponse.bind(this));
    this.request.on('error', this.onError.bind(this));
    this.request.setTimeout(5000, this.onTimeout.bind(this));

    // Start the download
    this.startTime = new Date().getTime();
    this.request.end();
  },

  handleAbort: function () {
    if (this.request) {
      this.request.abort();
      this.request.removeAllListeners();
    }
  },

  onResponse: function (response) {
    if (response.statusCode === 200) {
      // Emit the response data upwards
      this.emitData(response);
    } else {
      // Emit error upwards
      var code = response.statusCode.toString();
      this.emit('error', { message: code + ' received from source download' });

      // Logging
      winston.warn('source download response error', {
        code: code,
        source: this.source
      });
    }

    // Logging
    statsd.count('source.download.status-' + response.statusCode);
  },

  emitData: function (response) {
    // Setup the proxy emitter
    var that = this;
    var proxy = new events.EventEmitter();
    proxy.headers = response.headers;

    // Emit the proxy
    this.emit('response', proxy);

    response.on('data', function (chunk) {
      // Emit the data events to the proxy
      proxy.emit('data', chunk);

      // Logging
      winston.debug('received bytes from source', { n: chunk.length });
    });

    response.on('end', function () {
      // Emit the end event to the proxy
      proxy.emit('end');

      // Remove listeners
      response.removeAllListeners();

      // Logging
      var elapsed = new Date().getTime() - that.startTime;
      statsd.timing('source.download.success', elapsed);
      winston.debug('finished receiving file from source');
    });
  },

  onError: function (error) {
    // Emit the error upwards
    this.emit('error', error);

    // Logging
    statsd.count('source.download.error');
    winston.error('source download error', error);
  },

  onTimeout: function () {
    // Emit an error
    this.emit('error', { message: 'source download timeout' });

    // Abort the request
    this.handleAbort();

    // Logging
    statsd.count('source.download.timeout');
    winston.error('source download timeout', { url: this.source });
  }

});

module.exports = SourceDownloader;
