"use strict";

var co = require('co');

module.exports = ($scope, BMA) => {

  setTimeout(() => {
    $('select').material_select();
  }, 500);

  $scope.accept = () => {
    let modal = $('#modal1');
    if (modal.css('display') == 'none') {
      $('#modal1').openModal();
    }
  };

  $scope.previewPubkey = () => co(function *() {
    let data = yield BMA.webmin.key.preview({
      conf: $scope.$parent.conf
    });
    $scope.$parent.pubkey_preview = data.pubkey;
    let modal = $('#modal-pubkey');
    if (modal.css('display') == 'none') {
      $('#modal-pubkey').openModal();
    }
  });
};
