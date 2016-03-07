"use strict";

module.exports = ($scope, conf) => {

  $scope.$parent.conf = conf;

  $('i.prefix, label').addClass('active');
  $('input').attr('disabled', 'disabled');
};
