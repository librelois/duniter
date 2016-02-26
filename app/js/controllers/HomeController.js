"use strict";

module.exports = ($scope, $q) => {

  var co = require('co');

  $scope.phones = [];
  $scope.abc = 'abcdef';
  $scope.newIdentities = 2;

  var isMobile = require('../lib/mobileDetector');
  if (isMobile()) {
    $(".button-collapse").sideNav({
      menuWidth: 280
    });
    $(".button-collapse").sideNav('show');
  }

  //$q.when(co(function *() {
  //
  //  console.log('Waiting 1s...');
  //  var a = yield Promise.resolve(2);
  //  console.log('Waited 1s');
  //
  //  $scope.phones = [
  //    {'name': 'Nexus S' + a,
  //      'snippet': 'Fast just got faster with Nexus S.'},
  //    {'name': 'Motorola XOOM™ with Wi-Fi',
  //      'snippet': 'The Next, Next Generation tablet.'},
  //    {'name': 'MOTOROLA XOOM™',
  //      'snippet': 'The Next, Next Generation tablet.'}
  //  ];
  //}));
};
