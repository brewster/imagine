"use strict";

var dgram = require('dgram');
var winston = require('winston');

// Create a client for graphite by supplying the host
// and port
var Graphite = function () {
  this.configure({ port: 8125, host: '127.0.0.1', silent: false });
  this.createClient();
};

Graphite.prototype = {

  // Modify options on thie graphite instance
  configure: function (options) {
    var key;
    for (key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
  },

  // Create a client and bind to its messages
  createClient: function () {
    this.client = dgram.createSocket('udp4');
    this.client.on('error', function (error) {}); // ignore
  },

  // Count something (default 1)
  count: function (bucket, count) {
    count = count || 1;
    this.send(bucket + ':' + count + '|c');
  },

  // Record a timing
  timing: function (bucket, ms) {
    this.send(bucket + ':' + ms + '|ms');
  },

  // Send a request
  // Do nothing if we've been silenced
  send: function (data) {
    if (this.silent) {
      return;
    }
    data = this.prefix ? this.prefix + '.' + data : data;
    var buffer = new Buffer(data);
    this.client.send(buffer, 0, buffer.length, this.port, this.host);
  }

};

module.exports = new Graphite();
