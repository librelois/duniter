"use strict";

var co = require('co');

module.exports = ($scope, $state, $timeout, summary, bmapi, BMA, UIUtils, Graph) => {

  $scope.pubkey_preview = summary.pubkey;

  $scope.updateGraphs = () => {
    return co(function *() {
      let series = yield bmapi.utils.accounts.js($scope.pubkey_preview);
      let fseries = series.slice(0,6).map((serie) => {
        return {
          type: 'line',
          name: serie.name,
          data: serie.data
        };
      });
      Graph.accountsGraph("#accountsGraph", 0, fseries);
    });
  };

  $scope.download = () => {
    return co(function *() {
      let csv = yield bmapi.utils.accounts.csv();
      window.open(encodeURI("data:text/csv;charset=utf-8," + csv));
    });
  };

  return co(function *() {
    yield $scope.updateGraphs();
    $scope.$apply();
  });
};
