"use strict";

module.exports = ($scope, BMA, UIUtils) => {

  let serverWS = BMA.webmin.ws();

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

  Waves.displayEffect();

  $(".dropdown-button").dropdown({ constrainwidth: false });

  serverWS.on(undefined, (data) => {
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

  $scope.startServer = () => {
    $scope.server_stopped = false;
    co(function *() {
      yield BMA.webmin.server.http.start();
      yield BMA.webmin.server.services.startAll();
      $scope.server_started = true;
    });
  };

  $scope.stopServer = () => {
    $scope.server_started = false;
    co(function *() {
      yield BMA.webmin.server.http.stop();
      yield BMA.webmin.server.services.stopAll();
      $scope.server_stopped = true;
    });
  };

  function bindBlockWS() {
    bmapi.websocket.block().on(undefined, (block) => {
      $scope.current = block;
      $scope.$apply();
    });
  }

  return co(function *() {
    let summary = yield BMA.webmin.summary();
    yield BMA.webmin.server.http.start();
    bmapi = BMA.instance(summary.host);
    bindBlockWS();
    $scope.current = yield bmapi.blockchain.current();
    yield BMA.webmin.server.services.startAll();
  });
};
