"use strict";

module.exports = {

  modules: [],

  configure: function (names) {
    if (names) {
      names = names instanceof Array ? names : [names];
      names.forEach(function (name) {
        var Module = require(name);
        this.modules.push(Module);
      }, this);
    }
  }

};
