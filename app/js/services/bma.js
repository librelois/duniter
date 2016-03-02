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
              }, suffix = '', pkeys = [], queryParams = null;
              if (typeof params == 'object') {
                pkeys = _.keys(params);
                queryParams = {};
              }
              pkeys.forEach(function(pkey){
                var prevURI = uri;
                uri = uri.replace(new RegExp(':' + pkey), params[pkey]);
                if (prevURI == uri) {
                  queryParams[pkey] = params[pkey];
                }
              });
              config.params = queryParams;
              $http.get('http://' + server + uri + suffix, config)
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

        function postResource(uri) {
          return function(data, params) {
            return $q.when(Q.Promise((resolve, reject) => {
              var config = {
                timeout: 4000
              }, suffix = '', pkeys = [], queryParams = null;
              if (typeof params == 'object') {
                pkeys = _.keys(params);
                queryParams = {};
              }
              pkeys.forEach(function(pkey){
                var prevURI = uri;
                uri = uri.replace(new RegExp(':' + pkey), params[pkey]);
                if (prevURI == uri) {
                  queryParams[pkey] = params[pkey];
                }
              });
              config.params = queryParams;
              $http.post('http://' + server + uri + suffix, data, config)
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
          webmin: {
            summary: getResource('/webmin/summary'),
            server: {
              http: {
                start: getResource('/webmin/server/http/start'),
                stop: getResource('/webmin/server/http/stop')
              },
              services: {
                startAll: getResource('/webmin/server/services/start_all')
              },
              sendConf: postResource('/webmin/server/send_conf'),
              previewNext: getResource('/webmin/server/preview_next')
            },
            network: {
              interfaces: getResource('/webmin/network/interfaces')
            }
          },
          node: {
            summary: getResource('/node/summary')
          },
          wot: {
            lookup: getResource('/wot/lookup/:search'),
            members: getResource('/wot/members')
          },
          network: {
            peering: {
              peers: getResource('/network/peering/peers')
            },
            peers: getResource('/network/peers')
          },
          currency: {
            parameters: getResource('/blockchain/parameters')
          },
          blockchain: {
            current: getResource('/blockchain/current'),
            block: getResource('/blockchain/block/:block'),
            block_add: postResource('/blockchain/block'),
            stats: {
              ud: getResource('/blockchain/with/ud'),
              tx: getResource('/blockchain/with/tx')
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
