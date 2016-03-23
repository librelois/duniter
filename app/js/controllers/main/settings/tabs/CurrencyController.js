"use strict";

module.exports = ($scope, conf, UIUtils) => {

  $scope.$parent.conf = conf;

  UIUtils.enableInputs();
  $('input').attr('disabled', 'disabled');
};
