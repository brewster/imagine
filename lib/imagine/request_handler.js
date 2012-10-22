"use strict";

var url = require('url');
var winston = require('winston');
var Cascade = require('./cascade');
var EmptyResponseHandler = require('./empty_response_handler');
var operations = require('./operations');
var ResponseHandler = require('./response_handler');
var SignVerifier = require('./sign_verifier');
var SourceDownloader = require('./source_downloader');
var storage = require('./storage');
var statsd = require('./statsd');

var RequestHandler = function (request, response) {
  this.request = request;
  this.response = response;

  // Get any query parameters we're looking for
  var parsed = url.parse(request.url, true);
  this.source = parsed.query.source;
  this.sign = parsed.query.sign;
  this.nophoto = parsed.query.nophoto;

  // Parse out the key and operations
  var match = parsed.pathname.match(new RegExp('^\/(.*?)(\/.*)?$'));
  this.key = match[1];
  this.ops = match[2];

  // Determine whether we're modifying the file
  this.modified = this.ops && this.ops.length > 1;

  // For logging
  this.startTime = new Date().getTime();
};

RequestHandler.prototype = {

  // Handle an individual request
  handle: function () {
    var cascade = [];
    var callback = this.onComplete.bind(this);

    if (this.source) {
      // When a source file is included in this request: verify its sign,
      // download from the source, and upload into storage
      cascade.push(new SignVerifier(this.sign, this.source));
      cascade.push(new SourceDownloader(this.source));
      cascade.push(storage.uploader(this.key, this.request));
    } else {
      // When no source file, simply download from storage
      cascade.push(storage.downloader(this.key, this.request));
    }

    // Add in the operations modules
    operations.modules.forEach(function (Module) {
      cascade.push(new Module(this.ops, this.key, this.request));
    }, this);

    // Use a different response handler depending on if we're returning a
    // photo or not
    if (this.nophoto) {
      cascade.push(new EmptyResponseHandler(this.response, callback));
    } else {
      cascade.push(new ResponseHandler(this.response, callback));
    }

    // Setup the cascade and start it
    this.cascade = new Cascade(cascade);
    this.cascade.start();
  },

  onComplete: function () {
    // Stop the cascade (in case it's still running)
    this.cascade.stop();

    // Notify statsd after request
    var response = this.nophoto ? 'nophoto' : 'photo';
    var mod = this.modified ? 'modified' : 'unmodified';
    var type = this.source ? 'source' : 'storage';
    var name = 'request.' + response + '.' + type + '.' + mod;
    var elapsed = new Date().getTime() - this.startTime;

    statsd.count('request.all');
    statsd.count(name);
    statsd.timing(name, elapsed);
    winston.debug(name, { time: elapsed });
  }

};

module.exports = RequestHandler;
