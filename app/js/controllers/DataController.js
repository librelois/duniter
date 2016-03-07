"use strict";

var co = require('co');
var Peer = require('../lib/entity/peer');

module.exports = ($scope, $http, $state, BMA, peers) => {

  $scope.peers = peers.map((peer) => {
    let p = new Peer(peer);
    return {
      name: [p.getURL(), "(" + p.pubkey.slice(0, 6) + ")"].join(' '),
      host_port: [p.getHost(), p.getPort()].join('|')
    }
  });

  $scope.resetNode = () => co(function *() {
    yield BMA.webmin.server.http.stop();
    yield BMA.webmin.server.services.stopAll();
    yield BMA.webmin.server.resetData();
    let sp = $scope.remote_host.split('|');
    $state.go('sync', {
      host: sp[0],
      port: sp[1]
    })
  });
};
