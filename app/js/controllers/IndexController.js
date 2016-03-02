"use strict";

var co = require('co');

module.exports = ($scope, $http, $state, BMA) => {

  $scope.message = 'index.message.loading';
  co(function *() {
    let connected = false;
    try {
      let summary = yield BMA.webmin.summary();
      if (summary.current) {
        return $state.go('home');
      }
      return $state.go('configure.choose');
    }
    catch (e) {
      if (!connected) {
        return $state.go('error', { err: 'err.connection'});
      }
      return $state.go('error', { err: e });
    }
  });
};
