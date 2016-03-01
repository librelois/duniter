"use strict";

var co = require('co');
var conf = require('js/lib/conf/conf');

module.exports = ($scope, $http, $state, BMA) => {

  let autoconf = { local: {}, remote: {} };

  $scope.local_ipv4 = '127.0.0.1';

  co(function *() {
    let netinterfaces = yield BMA.webmin.network.interfaces();
    $scope.local_neti = toArrayOfAddresses(netinterfaces.local);
    $scope.remote_neti = toArrayOfAddresses(netinterfaces.remote);
    $scope.lport = conf.default_port;
    $scope.rport = conf.default_port;
    autoconf = netinterfaces.auto;
  });

  $scope.autoconfig = () => {
    $scope.local_ipv4 = autoconf.local.ipv4 || '';
    $scope.local_ipv6 = autoconf.local.ipv6 || '';
    $scope.remote_ipv4 = autoconf.remote.ipv4 || '';
    $scope.remote_ipv6 = autoconf.remote.ipv6 || '';
    $scope.lport = autoconf.local.port || $scope.lport;
    $scope.rport = autoconf.remote.port || $scope.rport;
    $scope.upnp = autoconf.remote.upnp || $scope.upnp;
    $scope.dns = autoconf.remote.dns || $scope.dns;
  };

  function toArrayOfAddresses(netiScope) {
    return netiScope.reduce(function(arr, neti) {
      return arr.concat(neti.addresses.map((addr) => {
        return {
          name: [neti.name, addr.address].join(' '),
          addr: addr.address,
          family: addr.family
        };
      }))
    }, []);
  }
};
