"use strict";

module.exports = ($scope, $http, $state, BMA) => {

  $scope.export_link = BMA.webmin.getExportURL();
};
