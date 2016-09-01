"use strict";

module.exports = ($scope, Importer, BMA) => {

  $scope.export_link = BMA.webmin.getExportURL();

  Importer($scope);
};
