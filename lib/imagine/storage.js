"use strict";

var winston = require('winston');

module.exports = {

  configure: function (config, callback) {
    // Configure the storage module, passing in its configuration options
    var Module = require(config.storage);
    var options = config[config.storage];
    var storage = new Module(options);

    // Set up the public methods
    this.ready = storage.ready.bind(storage);
    this.uploader = storage.uploader.bind(storage);
    this.downloader = storage.downloader.bind(storage);

    // Run the callback once the storage is deemed ready
    this.callOnceReady(callback);
  },

  callOnceReady: function (callback) {
    var interval = setInterval(function (that) {
      if (that.ready()) {
        // Stop the interval and run the callback when ready
        clearInterval(interval);
        callback();
      } else {
        // Log until it's ready
        winston.debug('waiting for storage to connect');
      }
    }, 200, this);
  }

};
