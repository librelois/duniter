"use strict";

var co = require('co');

module.exports = ($scope, $http, $state, BMA) => {

  $scope.idty_uid = 'cgeek';
  $scope.idty_entropy = 'abc';
  $scope.idty_password = 'abc';

  setTimeout(() => {
    $('select').material_select();
    $('.modal-trigger').leanModal();
    $('#modal1').openModal();
  }, 500);
};
