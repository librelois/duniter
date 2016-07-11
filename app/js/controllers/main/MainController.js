"use strict";

var co = require('co');

module.exports = ($scope, $state, BMA, summary, UIUtils) => {

  Waves.displayEffect();

  var isMobile = require('js/lib/mobileDetector');
  if (isMobile()) {
    $(".button-collapse").sideNav({
      menuWidth: 280
    });
  }

  UIUtils.changeTitle(summary.version);

  $scope.openWallet = () => {

    let walletHeight = parseInt(localStorage.getItem('wallet_height')) || 1000;
    let walletWidth = parseInt(localStorage.getItem('wallet_width')) || 1400;

    gui.Window.open (window.location.origin + '/cesium/index.html', {
      position: 'center',
      height: walletHeight,
      width: walletWidth
    }, function(win) {
      win.on('closed', function() {
        localStorage.setItem('wallet_height', win.window.innerHeight - 8); // Seems to always have 8 pixels more
        localStorage.setItem('wallet_width', win.window.innerWidth - 16); // Seems to always have 16 pixels more
      });
    });
  };

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
