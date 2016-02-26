var _ = require('underscore');
var conf = require('../lib/conf/conf');

module.exports = (angular) => {

  angular.module('duniter.services', ['ngResource'])

    .factory('BMA', function($http, $q) {

      function BMA(server) {

        function getResource(uri) {
          return function(params) {
            return $q.when(Q.Promise((resolve, reject) => {
              var config = {
                timeout: 4000
              }, suffix = '', pkeys = [], queryParams = {};
              if (typeof params == 'object') {
                pkeys = _.keys(params);
              }
              pkeys.forEach(function(pkey){
                var prevURI = uri;
                uri = uri.replace(new RegExp(':' + pkey), params[pkey]);
                if (prevURI == uri) {
                  queryParams[pkey] = params[pkey];
                }
              });
              config.params = queryParams;
              $http.get(uri + suffix, config)
                .success(function(data, status, headers, config) {
                  resolve(data);
                })
                .error(function(data, status, headers, config) {
                  console.log(data);
                  reject(data);
                });
            }));
          }
        }

        function ws(uri) {
          var sock = new WebSocket(uri);
          sock.onclose = function(e) {
            console.log('close');
            console.log(e);
          };
          sock.onerror = function(e) {
            console.log('onerror');
            console.log(e);
          };
          return {
            on: function(type, callback) {
              sock.onmessage = function(e) {
                callback(JSON.parse(e.data));
              };
            }
          };
        }

        return {
          node: {
            summary: getResource('http://' + server + '/node/summary'),
          },
          wot: {
            lookup: getResource('http://' + server + '/wot/lookup/:search'),
            members: getResource('http://' + server + '/wot/members')
          },
          network: {
            peering: {
              peers: getResource('http://' + server + '/network/peering/peers')
            },
            peers: getResource('http://' + server + '/network/peers')
          },
          currency: {
            parameters: getResource('http://' + server + '/blockchain/parameters')
          },
          blockchain: {
            current: getResource('http://' + server + '/blockchain/current'),
            block: getResource('http://' + server + '/blockchain/block/:block'),
            stats: {
              ud: getResource('http://' + server + '/blockchain/with/ud'),
              tx: getResource('http://' + server + '/blockchain/with/tx')
            }
          },
          websocket: {
            block: function() {
              return ws('ws://' + server + '/ws/block');
            },
            peer: function() {
              return ws('ws://' + server + '/ws/peer');
            }
          }
        }
      }
      var service = BMA([conf.server, conf.port].join(':'));
      service.instance = BMA;
      return service;
    });
};
