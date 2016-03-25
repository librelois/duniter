"use strict";

var co = require('co');

module.exports = ($scope, $state, BMA) => {

  Waves.displayEffect();

  var isMobile = require('js/lib/mobileDetector');
  if (isMobile()) {
    $(".button-collapse").sideNav({
      menuWidth: 280
    });
  }

  $scope.startServer = () => {
    $scope.server_stopped = false;
    return co(function *() {
      yield BMA.webmin.server.http.start();
      yield BMA.webmin.server.services.startAll();
      yield BMA.webmin.server.http.regularUPnP();
      $scope.server_started = true;
    });
  };

  $scope.stopServer = () => {
    $scope.server_started = false;
    return co(function *() {
      yield BMA.webmin.server.http.stop();
      yield BMA.webmin.server.services.stopAll();
      $scope.server_stopped = true;
    });
  };

  $scope.restartServer = () => {
    return co(function *() {
      yield $scope.stopServer();
      yield $scope.startServer();
    });
  };
};
