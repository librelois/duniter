"use strict";

const co = require('co');

module.exports = ($scope, $http, $state, $timeout, UIUtils, summary, BMA) => {

  $scope.cpuPower = parseInt(summary.conf.cpu * 100);

  $scope.updateCPUpower = () => co(function *() {
    $scope.savingCPU = true;
    yield BMA.webmin.server.cpuConf({
      cpu: parseFloat(($scope.cpuPower / 100).toFixed(2))
    });
    UIUtils.toast('settings.cpu.saved');
    $scope.savingCPU = false;
  });
};
