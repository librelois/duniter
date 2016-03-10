"use strict";

module.exports = {

  init: () => {

    // Hack since Node v5
    window.jade = require('jade/runtime');

    console.log('Configuring Angular app...');

    require('./app.config')();

    console.log('App initialized.');
  }
};
