"use strict";

module.exports = ($scope, BMA) => {

  let co = require('co');
  let bmapi;

  $scope.server_started = true;
  $scope.server_stopped = false;
  $scope.phones = [];
  $scope.abc = 'abcdef';
  $scope.newIdentities = 2;

  var isMobile = require('../lib/mobileDetector');
  if (isMobile()) {
    $(".button-collapse").sideNav({
      menuWidth: 280
    });
  }

  //$(".dropdown-button").dropdown({ constrainwidth: false });

  //return co(function *() {
  //  let summary = yield BMA.webmin.summary();
  //  yield BMA.webmin.server.http.start();
  //  bmapi = BMA.instance(summary.host);
  //  bmapi.websocket.block().on(undefined, (block) => {
  //    $scope.current = block;
  //    $scope.$apply();
  //  });
  //  $scope.current = yield bmapi.blockchain.current();
  //  yield BMA.webmin.server.services.startAll();
  //});
};
