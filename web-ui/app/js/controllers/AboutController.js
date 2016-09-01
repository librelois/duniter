"use strict";

const co = require('co');

module.exports = ($scope, version, UIUtils) => {

  $scope.version = version;

  return co(function*() {
    $scope.$parent.title = yield UIUtils.translate('help.about_duniter.title');
  });
};
