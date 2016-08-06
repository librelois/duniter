"use strict";

const co = require('co');

module.exports = ($scope, $http, $state, $timeout, UIUtils, Upload, BMA) => {

  $scope.export_link = BMA.webmin.getExportURL();

  $scope.uploadFiles = function(file, errFiles) {
    $scope.f = file;
    $scope.errFile = errFiles && errFiles[0];
    if (file) {
      UIUtils.toast('settings.data.backup.importing');
      file.upload = Upload.upload({
        url: BMA.webmin.getImportURL(),
        data: { importData: file }
      });

      file.upload.then(function (response) {
        $timeout(function () {
          UIUtils.toast('settings.data.backup.imported');
          $state.go('main.home.overview');
          file.result = response.data;
        });
      }, function (response) {
        if (response.status > 0)
          $scope.errorMsg = response.status + ': ' + response.data;
      }, function (evt) {
        file.progress = Math.min(100, parseInt(100.0 *
          evt.loaded / evt.total));
      });
    }
  }
};
