"use strict";

var co = require('co');
var conf = require('js/lib/conf/conf');

module.exports = ($scope, $http, $state, BMA) => {

  let autoconf = { local: {}, remote: {} };

  co(function *() {
    let netinterfaces = yield BMA.webmin.network.interfaces();
    $scope.local_neti = toArrayOfAddresses(netinterfaces.local);
    $scope.remote_neti = toArrayOfAddresses(netinterfaces.remote);
    $scope.$parent.conf.lport = conf.default_port;
    $scope.$parent.conf.rport = conf.default_port;
    autoconf = netinterfaces.auto;
    // Trigger autoconfig
    $scope.autoconfig();
  });

  $scope.autoconfig = () => {
    $scope.$parent.conf.local_ipv4 = autoconf.local.ipv4 || '';
    $scope.$parent.conf.local_ipv6 = autoconf.local.ipv6 || '';
    $scope.$parent.conf.remote_ipv4 = autoconf.remote.ipv4 || '';
    $scope.$parent.conf.remote_ipv6 = autoconf.remote.ipv6 || '';
    $scope.$parent.conf.lport = autoconf.local.port || $scope.$parent.conf.lport;
    $scope.$parent.conf.rport = autoconf.remote.port || $scope.$parent.conf.rport;
    $scope.$parent.conf.upnp = autoconf.remote.upnp || $scope.$parent.conf.upnp;
    $scope.$parent.conf.dns = autoconf.remote.dns || $scope.$parent.conf.dns;
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
