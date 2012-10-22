"use strict";

var fs = require('fs');
var url = require('url');
var http = require('http');
var https = require('https');
var winston = require('winston');
var RequestHandler = require('./request_handler');

var Server = function (config) {
  // Set up SSL, if appropriate
  if (config.ssl) {
    this.ssl = config.ssl;
    this.ssl.key = fs.readFileSync(this.ssl.key, 'utf8');
    this.ssl.cert = fs.readFileSync(this.ssl.cert, 'utf8');
  }

  // Get the server options
  this.host = config.host || '127.0.0.1';
  this.port = config.port || 8100;
  http.globalAgent.maxSockets = config.max_sockets || 1024;

  // Create the server
  this.create();
};

Server.prototype = {

  // Start listening
  start: function () {
    var that = this;
    this.server.listen(this.port, this.host, function () {
      // Log it
      winston.info('listening', {
        host: that.host,
        port: that.port,
        ssl: !!that.ssl
      });
    });
  },

  // Create a new server
  create: function () {
    // Determine https vs. http
    this.server = this.ssl ?
        https.createServer(this.ssl) :
        http.createServer();

    // Bind to the request
    this.server.on('request', this.handle.bind(this));
  },

  // Handle an individual request
  handle: function (request, response) {
    var path = url.parse(request.url, false).pathname;

    if (path === '/') {
      // A base request just prints out the current Imagine version
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ version: '0.1.0' }));
    } else {
      // All other requests are passed to the handler
      new RequestHandler(request, response).handle();
    }
  }

};

module.exports = Server;
