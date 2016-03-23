"use strict";

module.exports = ($scope, BMA, UIUtils, summary, bmapi) => {

  let co = require('co');

  bindBlockWS();
  $scope.current = summary.current;
  $scope.server_started = true;
  $scope.server_stopped = false;
  $scope.phones = [];
  $scope.abc = 'abcdef';
  $scope.newIdentities = 2;

  Waves.displayEffect();

  $(".dropdown-button").dropdown({ constrainwidth: false });

  BMA.webmin.ws().on(undefined, (data) => {
    if (data.type === 'started') {
      $scope.server_started = true;
      $scope.server_stopped = false;
      bindBlockWS();
      UIUtils.toast('general.server.started');
      $scope.$apply();
    }
    if (data.type === 'stopped') {
      $scope.server_stopped = true;
      $scope.server_started = false;
      UIUtils.toast('general.server.stopped');
      $scope.$apply();
    }
  });

  function bindBlockWS() {
    bmapi.websocket.block().on(undefined, (block) => {
      $scope.current = block;
      $scope.$apply();
    });
  }

  return co(function *() {
    yield $scope.startServer();
  });
};
