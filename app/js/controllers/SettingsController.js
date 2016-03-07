"use strict";

var co = require('co');

module.exports = ($scope, $http, $state, BMA) => {

  $('ul.tabs').tabs();
  $('ul.tabs a').click((e) => {
    console.log('clicked');
    let href = $(e.currentTarget).attr('href');
    let state = href.slice(1);
    $state.go(state);
  });

  return co(function *() {

  });
};
