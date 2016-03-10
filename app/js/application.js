"use strict";

module.exports = {

  init: () => {

    console.log('Configuring Angular app...');

    require('./app.config')();

    console.log('App initialized.');
  }
};
