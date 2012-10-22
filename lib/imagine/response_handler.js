"use strict";

var extend = require('obj-extend');

var ResponseHandler = function (response, callback) {
  this.response = response;
  this.callback = callback;
};

ResponseHandler.prototype = {

  handleResponse: function (response) {
    var that = this;

    // Add some additional headers to the defaults
    var headers = extend({}, response.headers, {
      'connection': 'keep-alive',
      'pragma': 'public',
      'cache-control': 'public, max-age=2419200',
      'date': new Date().toGMTString()
    });

    // Use chunked if we don't have a content-length
    if (!headers['content-length']) {
      headers['transfer-encoding'] = 'chunked';
    }

    // Write out the head
    this.head(200, headers);

    // Write out the chunks as we get them
    response.on('data', function (chunk) {
      that.body(chunk);
    });

    // Close out when the response has ended
    response.on('end', function () {
      that.close();
      response.removeAllListeners();
    });
  },

  handleError: function (error) {
    // Determine status code
    var code = error.statusCode ? parseInt(error.statusCode, 10) : 500;

    // Write out the head
    this.head(code, {
      'content-type': 'application/json'
    });

    // Write out the body and close the connection
    this.close(JSON.stringify({
      message: error.message,
      detail: error.detail,
      code: code
    }));
  },

  head: function (code, headers) {
    this.response.writeHead(code, headers);
  },

  body: function (data) {
    this.response.write(data);
  },

  close: function (data) {
    this.response.end(data);

    // Run the callback, if present
    if (this.callback) {
      this.callback();
    }
  }

};

module.exports = ResponseHandler;
