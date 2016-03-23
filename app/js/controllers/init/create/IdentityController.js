"use strict";

var co = require('co');

module.exports = ($scope, $timeout, BMA) => {

  setTimeout(() => {
    $('select').material_select();
  }, 500);

  $scope.accept = () => {
    let modal = $('#modal1');
    if (modal.css('display') == 'none') {
      $('#modal1').openModal();
    }
  };

  let concat = "";
  $scope.pubkey_preview = "";
  let timeout = preview();

  function preview() {
    return $timeout(() => {
      if ($scope.$parent) {
        let salt = $scope.$parent.conf.idty_entropy;
        let pass = $scope.$parent.conf.idty_password;
        let newConcat = [salt, pass].join('');
        if (salt && pass && newConcat != concat) {
          console.log('different');
          concat = newConcat;
          $scope.previewPubkey(concat);
          timeout = preview();
        } else {
          timeout = preview();
        }
      }
    }, 100);
  }

  $scope.previewPubkey = () => co(function *() {
    let data = yield BMA.webmin.key.preview({
      conf: $scope.$parent.conf
    });
    $scope.pubkey_preview = data.pubkey;
  }).catch(() => null);
};
