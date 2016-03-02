"use strict";

var co = require('co');

module.exports = ($scope) => {

  setTimeout(() => {
    $('select').material_select();
  }, 500);

  $scope.accept = () => {
    $('#modal1').openModal();
  };
};
