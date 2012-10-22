"use strict";

var crypto = require('crypto');
var events = require('events');
var extend = require('obj-extend');

var SignVerifier = function (expectedSign, data) {
  var key = SignVerifier.signedKey;

  // When we have a signed key
  if (key) {
    // Create the correct sign
    var sign = crypto.createHmac('sha1', key).update(data).digest('hex');

    // Verify whether the expected sign matches the correct sign
    if (sign === expectedSign) {
      this.verified = true;
    }
  } else {
    // Without a signed key in the config, all requests are valid
    this.verified = true;
  }
};

SignVerifier.prototype = extend({}, events.EventEmitter.prototype, {

  handleResponse: function (response) {
    if (this.verified) {
      // Pass-through the response if it's been verified
      this.emit('response', response);
    } else {
      // Emit an error upwards when we have an incorrect sign
      this.emit('error', {
        statusCode: 403,
        message: 'access denied'
      });
    }
  }

});

module.exports = SignVerifier;
