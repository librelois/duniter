"use strict";

var co = require('co');
var conf = require('js/lib/conf/conf');

module.exports = ($scope, $http, $state, BMA) => {

  $scope.generated = '';
  $scope.started = false;
  $scope.message = 'configuration.create_root.need_a_try';

  co(function *() {
    try {
      yield BMA.node.summary();
      $scope.started = true;
    } catch (e) {
      $scope.started = false;
      $scope.start();
    }
  });

  $scope.start = () => co(function *() {
    try {
      yield BMA.webmin.server.http.start();
      $scope.started = true;
      yield BMA.webmin.server.sendConf({
        conf: $scope.$parent.conf
      });
      yield $scope.try();
    } catch (e) {
      $scope.message = e.message;
    }
  });

  $scope.stop = () => co(function *() {
    yield BMA.webmin.server.http.stop();
    $scope.started = false;
  });

  $scope.try = () => co(function *() {
    try {
      $scope.block = yield BMA.webmin.server.previewNext();
      $scope.generated = $scope.block.raw;
      $scope.message = '';
    } catch (e) {
      $scope.message = e.message;
    }
  });

  $scope.accept = () => co(function *() {
    let bmapi = BMA.instance([$scope.$parent.conf.local_ipv4, $scope.$parent.conf.lport].join(':'));
    let res = yield bmapi.blockchain.block_add({
      block: $scope.generated
    });
    if (res.number == 0) {
      // We successfully started the blockchain
      yield $scope.startServices();
    }
  });

  $scope.startServices = () => co(function *() {
    yield BMA.webmin.server.services.startAll();
    $state.go('index');
  });
};
