"use strict";

var co = require('co');

module.exports = ($scope, $http, $state, BMA) => {

  let syncWS = BMA.webmin.ws.sync();

  $scope.synchronizing = false;
  $scope.sync_failed = false;
  $scope.host = '192.168.1.35'; // default port
  $scope.port = 38017; // default port
  //$scope.port = 8999; // default port
  $scope.wrong_host = false;

  $scope.checkNode = () => co(function *() {
    $scope.checking = true;
    co(function *() {
      try {
        let targetHost = [$scope.host, $scope.port].join(':');
        let bmapi = BMA.instance(targetHost);
        let current = yield bmapi.blockchain.current();
        if (current) {
          $scope.checked_host = targetHost;
        }
      } catch (e) {
      }
      $scope.checking = false;
    });
  });

  $scope.startSync = () => {
    $scope.down_percent = 0;
    $scope.apply_percent = 0;
    $scope.sync_failed = false;
    $scope.synchronizing = true;
    return co(function *() {
      let sp = $scope.checked_host.split(':');
      syncWS.on(undefined, (data) => {
        console.log(data);
        if (data.type == 'sync') {
          $scope.down_percent = 100;
          $scope.apply_percent = 100;
          $scope.sync_failed = data.value;
          if (data.value === true) {
            $state.go('index');
          }
        } else {
          let changed = true;
          if (data.type == 'download' && $scope.down_percent != data.value) {
            $scope.down_percent = data.value;
            changed = true;
          }
          if (data.type == 'applied' && $scope.apply_percent != data.value) {
            $scope.apply_percent = data.value;
            changed = true;
          }
          if (changed) {
            $scope.$apply();
          }
        }
      });
      yield BMA.webmin.server.autoConfNetwork();
      BMA.webmin.server.startSync({
        host: sp[0],
        port: sp[1]
      });
    });
  }
};
