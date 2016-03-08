"use strict";

module.exports = ($scope) => {

  setTimeout(() => {
    $('select').material_select();
  }, 500);

  $scope.accept = () => {
    let modal = $('#modal1');
    if (modal.css('display') == 'none') {
      $('#modal1').openModal();
    }
  };
};
