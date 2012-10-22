"use strict";

var events = require('events');
var extend = require('obj-extend');

var Cascade = function (modules) {
  this.modules = modules;
  this.configure();
};

Cascade.prototype = extend({}, events.EventEmitter.prototype, {

  // Simply emitting a response starts the cascade
  start: function () {
    this.emit('response');
  },

  // Stopping the cascade removes all listeners and calls handleAbort
  stop: function () {
    this.modules.forEach(function (module) {
      // Remove all listeners, if appropriate
      if (module.removeAllListeners) {
        module.removeAllListeners();
      }

      // Call handleAbort, if appropriate
      if (module.handleAbort) {
        module.handleAbort();
      }
    });
  },

  // Set up the cascade listening to call handleResponse and handleError on
  // response and error events, respectively, of the last module in the cascade
  configure: function () {
    // By default, we include this object as an unbound response module so that
    // we can start off the cascade when start() is called
    var resModules = [this];
    var errModules = [];

    // Loop through each module in the cascade and set up any event binds
    this.modules.forEach(function (module) {
      // If this module can handle responses, bind the event from any previous
      // unbound modules onto it
      if (module.handleResponse) {
        resModules.forEach(function (resModule) {
          resModule.on('response', module.handleResponse.bind(module));
        });

        // Clear out the bound response modules
        resModules = [];
      }

      // If this module can handle errors, bind the event from any previous
      // unbound modules onto it
      if (module.handleError) {
        errModules.forEach(function (errModule) {
          errModule.on('error', module.handleError.bind(module));
        });

        // Clear out the bound error modules
        errModules = [];
      }

      // Add this module to the array of unbound response/error modules
      resModules.push(module);
      errModules.push(module);
    });
  }

});

module.exports = Cascade;
