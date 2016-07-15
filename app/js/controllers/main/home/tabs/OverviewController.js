"use strict";

module.exports = ($scope, BMA, UIUtils, summary, bmapi, ws) => {

  let co = require('co');

  bindBlockWS();
  const UD = summary.parameters.c * summary.current.monetaryMass / summary.current.membersCount;
  $scope.current = summary.current;
  $scope.monetaryMass = summary.current.monetaryMass / UD;
  $scope.server_started = true;
  $scope.server_stopped = false;
  $scope.phones = [];
  $scope.abc = 'abcdef';
  $scope.newIdentities = 2;

  $(".dropdown-button").dropdown({ constrainwidth: false });

  ws.on(undefined, (data) => {
    if (data.type === 'started') {
      $scope.server_started = true;
      $scope.server_stopped = false;
      bindBlockWS();
      UIUtils.toast('general.server.started');
      $scope.$apply();
    }
    if (data.type === 'stopped') {
      $scope.server_stopped = true;
      $scope.server_started = false;
      UIUtils.toast('general.server.stopped');
      $scope.$apply();
    }
  });

  function bindBlockWS() {
    bmapi.websocket.block().on(undefined, (block) => {
      $scope.current = block;
      $scope.$apply();
    });
  }
  
  $scope.reconfigure_network = () => co(function *() {
    $scope.reconfiguring = true;
    let delay = Q.delay(1000);
    try {
      let netinferfaces = yield BMA.webmin.network.interfaces();
      let conf = {};
      conf.local_ipv4 = netinferfaces.auto.local.ipv4 || '';
      conf.local_ipv6 = netinferfaces.auto.local.ipv6 || '';
      conf.remote_ipv4 = netinferfaces.auto.remote.ipv4 || '';
      conf.remote_ipv6 = netinferfaces.auto.remote.ipv6 || '';
      conf.lport = netinferfaces.auto.local.port || 9330;
      conf.rport = netinferfaces.auto.remote.port || 9330;
      conf.upnp = netinferfaces.auto.remote.upnp || false;
      conf.dns = netinferfaces.auto.remote.dns || '';
      yield BMA.webmin.server.netConf({
        conf: conf
      });
      yield delay;
      $scope.should_reconfigure = false;
      UIUtils.toast('general.network.reconf_ok');
      $scope.$apply();
    } catch (e) {
      yield delay;
      $scope.reconfiguring = false;
      $scope.$apply();
    }
  });

  return co(function *() {
    yield $scope.startServer();
    try {
      yield bmapi.network.peering.self();
    } catch (e) {
      console.log(e);
      $scope.should_reconfigure = true;
    }
  });
};
