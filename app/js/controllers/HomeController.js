"use strict";

module.exports = ($scope, BMA) => {

  let co = require('co');
  let bmapi;

  $scope.phones = [];
  $scope.abc = 'abcdef';
  $scope.newIdentities = 2;

  var isMobile = require('../lib/mobileDetector');
  if (isMobile()) {
    $(".button-collapse").sideNav({
      menuWidth: 280
    });
  }

  return co(function *() {
    let summary = yield BMA.webmin.summary();
    bmapi = BMA.instance(summary.host);
    bmapi.websocket.block().on('block', (block) => {
      $scope.current = block;
      $scope.$apply();
    });
  });
};
