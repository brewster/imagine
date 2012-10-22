"use strict";

var extend = require('obj-extend');
var ResponseHandler = require('./response_handler');

var EmptyResponseHandler = function (response, callback) {
  this.response = response;
  this.callback = callback;
};

// Merge properties from standard response handler
EmptyResponseHandler.prototype = extend({}, ResponseHandler.prototype, {

  handleResponse: function (response) {
    var that = this;

    // Setup headers
    var headers = extend({}, response.headers, {
      'content-length': '0'
    });

    // Write out the head
    this.head(204, headers);

    // Close out immediately because we don't care about a response
    this.close();
  }

});

module.exports = EmptyResponseHandler;
