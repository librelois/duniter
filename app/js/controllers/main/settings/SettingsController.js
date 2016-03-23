"use strict";

var co = require('co');

module.exports = ($scope, $http, $state, $location, BMA, UIUtils) => {

  UIUtils.enableTabs();

  $scope.$parent.conf = $scope.$parent.conf || {};
  $scope.$parent.menu = 'settings';

  $(".dropdown-button").dropdown({ constrainwidth: false });

  $scope.fullReset = () => co(function *() {
    yield BMA.webmin.server.http.stop();
    yield BMA.webmin.server.services.stopAll();
    yield BMA.webmin.server.resetData();
    $state.go('index');
  });
};
