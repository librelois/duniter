"use strict";

var co = require('co');

module.exports = ($scope, $http, $state, $location, BMA) => {

  $scope.$parent.conf = $scope.$parent.conf || {};

  let jTabs = $('ul.tabs');
  jTabs.tabs();
  $('ul.tabs a').click((e) => {
    let href = $(e.currentTarget).attr('href');
    let state = href.slice(1);
    $state.go(state);
  });

  let currentID = $location.path()
    .replace(/\//g, '.')
    .replace(/\./, '');

  jTabs.tabs('select_tab', currentID);

  Waves.displayEffect();
};
