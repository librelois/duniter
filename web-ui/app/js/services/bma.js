var co = require('co');
var _ = require('underscore');
var conf = require('../lib/conf/conf');

module.exports = (angular) => {

  angular.module('duniter.services', ['ngResource'])

    .factory('BMA', function($http, $q) {

      function httpProtocol() {
        return window.location.protocol + '//';
      }

      function wsProtocol() {
        return window.location.protocol === 'https:' ? 'wss://' : 'ws://';
      }

      function BMA(server) {

        function getResource(uri, protocol) {
          return function(params) {
            return $q.when(httpGet(uri, params, protocol));
          }
        }

        function httpGet(uri, params, protocol) {
          return Q.Promise((resolve, reject) => {
            var config = {
              timeout: conf.api_timeout
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
            $http.get((protocol || httpProtocol()) + server + uri + suffix, config)
              .success(function(data, status, headers, config) {
                resolve(data);
              })
              .error(function(data, status, headers, config) {
                console.log(data);
                reject(data);
              });
          });
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
              $http.post(httpProtocol() + server + uri + suffix, data, config)
                .success(function(data, status, headers, config) {
                  resolve(data);
                })
                .error(function(data, status, headers, config) {
                  reject(data);
                });
            }));
          }
        }

        function bmaGET(uri) {
          return getResource('/bma' + uri);
        }

        function bmaPOST(uri) {
          return postResource('/bma' + uri);
        }

        function bmaWS(server, uri) {
          return ws(wsProtocol() + server + '/bma' + uri);
        }

        let wsMap = {};

        function ws(uri) {
          var sock = wsMap[uri] || new WebSocket(uri);
          wsMap[uri] = sock;
          sock.onclose = function(e) {
            console.log('close');
            console.log(e);
          };
          sock.onerror = function(e) {
            console.log('onerror');
            console.log(e);
          };
          let opened = false, openedCallback;
          sock.onopen = function() {
            opened = true;
            openedCallback && openedCallback();
          };
          let listener, messageType;
          sock.onmessage = function(e) {
            let res = JSON.parse(e.data);
            if (res.type == 'log') {
              for (let i = 0, len = res.value.length; i < len; i++) {
                let log = res.value[i];
                // console[log.level](log.msg);
              }
            }
            if (listener && (messageType === undefined || (res.type === messageType))) {
              listener(res);
            }
          };
          return {
            on: function(type, callback) {
              messageType = type;
              listener = callback;
            },
            whenOpened: () => co(function *() {
              if (opened) return true;
              else {
                yield Q.Promise((resolve) => {
                  openedCallback = resolve;
                });
              }
            }),
            send: (msg) => sock.send(msg)
          };
        }

        return {
          utils: {
            accounts: {
              js: getAccountsJS((uri) => httpGet(uri)),
              csv: getAccountsCSV((uri) => httpGet(uri))
            }
          },
          webmin: {
            getExportURL: () => httpProtocol() + server + '/webmin/data/duniter_export',
            getImportURL: () => httpProtocol() + server + '/webmin/data/duniter_import',
            ws: () => ws(wsProtocol() + server + '/webmin/ws'),
            summary: getResource('/webmin/summary'),
            server: {
              http: {
                start: getResource('/webmin/server/http/start'),
                stop: getResource('/webmin/server/http/stop'),
                openUPnP: getResource('/webmin/server/http/upnp/open'),
                regularUPnP: getResource('/webmin/server/http/upnp/regular')
              },
              services: {
                startAll: getResource('/webmin/server/services/start_all'),
                stopAll: getResource('/webmin/server/services/stop_all')
              },
              sendConf: postResource('/webmin/server/send_conf'),
              netConf: postResource('/webmin/server/net_conf'),
              keyConf: postResource('/webmin/server/key_conf'),
              cpuConf: postResource('/webmin/server/cpu_conf'),
              testSync: postResource('/webmin/server/test_sync'),
              startSync: postResource('/webmin/server/start_sync'),
              previewNext: getResource('/webmin/server/preview_next'),
              autoConfNetwork: getResource('/webmin/server/auto_conf_network'),
              resetData: getResource('/webmin/server/reset/data'),
              republishNewSelfPeer: getResource('/webmin/server/republish_selfpeer')
            },
            key: {
              preview: postResource('/webmin/key/preview')
            },
            network: {
              interfaces: getResource('/webmin/network/interfaces')
            }
          },
          node: {
            summary: bmaGET('/node/summary')
          },
          wot: {
            lookup: bmaGET('/wot/lookup/:search'),
            members: bmaGET('/wot/members')
          },
          network: {
            peering: {
              self: bmaGET('/network/peering'),
              peers: bmaGET('/network/peering/peers')
            },
            peers: bmaGET('/network/peers')
          },
          currency: {
            parameters: bmaGET('/blockchain/parameters')
          },
          blockchain: {
            current: bmaGET('/blockchain/current'),
            block: bmaGET('/blockchain/block/:block'),
            blocks: bmaGET('/blockchain/blocks/:count/:from'),
            block_add: bmaPOST('/blockchain/block'),
            stats: {
              ud: bmaGET('/blockchain/with/ud'),
              tx: bmaGET('/blockchain/with/tx')
            }
          },
          websocket: {
            block: function() {
              return bmaWS(server, '/ws/block');
            },
            peer: function() {
              return bmaWS(server, '/ws/peer');
            }
          },
          origin: {
            network: {
              peering: {
                self: getResource('/network/peering', 'http://')
              }
            }
          }
        }
      }
      let server = window.location.hostname;
      let port = window.location.port;
      var service = BMA([server, port].join(':'));
      service.instance = BMA;
      return service;
    });


  /******
   * ACCOUNTS DUMPING
   */

  function getAccountsJS(getResource) {
    return (pubkey) => co(function *() {
      let result = yield getAccounts(getResource, pubkey);
      let withUD = result.withUD;
      let columns = result.columns;
      let getBlock = result.getBlock;
      let current = result.current;
      let UDt1 = result.UDt1;
      let series = ['1/c','M/N'].concat(columns).map((col) => {
        return {
          name: col.key || col,
          data: []
        };
      });
      for(let i = 0; i < withUD.result.blocks.length; i++) {
        let bnum = withUD.result.blocks[i];
        let b = yield getBlock(bnum);
        let Mprev = b.monetaryMass - b.membersCount*b.dividend;
        let N = b.membersCount;
        let UD = b.dividend;
        let values = [10,(Mprev/N)/UD].concat(columns.map((col) => (col.balances[i]/UD)));
        values.forEach((v,index) => series[index].data.push(v));
      }
      let MonN = current.monetaryMass/current.membersCount;
      let values = [10,MonN/UDt1].concat(columns.map((col) => (col.balances[withUD.result.blocks.length]/UDt1)));
      values.forEach((v,index) => series[index].data.push(v));
      return series;
    });
  }

  function getAccountsCSV(getResource) {
    return () => co(function *() {
      let result = yield getAccounts(getResource);
      let withUD = result.withUD;
      let columns = result.columns;
      let getBlock = result.getBlock;
      let current = result.current;
      let UDt1 = result.UDt1;
      let csv = 'M;' + 'N;' + 'UD;' + columns.map((col) => (col.key)).join(';') + '\n';
      for(let i = 0; i < withUD.result.blocks.length; i++) {
        let bnum = withUD.result.blocks[i];
        let b = yield getBlock(bnum);
        csv += (b.monetaryMass - b.membersCount*b.dividend) + ';' + b.membersCount + ';' + b.dividend + ';' + columns.map((col) => (col.balances[i])).join(';') + '\n';
      }
      csv += current.monetaryMass + ';' + current.membersCount + ';' + UDt1 + ';' + columns.map((col) => (col.balances[withUD.result.blocks.length])).join(';') + '\n';
      return csv;
    });
  }

  function getAccounts(getResource, filteringPubkey) {
    let backup = localStorage.getItem('accounts');
    let memory = (backup && JSON.parse(backup)) || {};

    return co(function*(){
      let accounts = {};
      let amounts = {};
      let withUD = yield getWithUD();
      let withTX = yield getWithTX();
      let withNewcomers = yield getWithNewcomers();

      let current = yield getCurrent();
      let UDt1 = Math.floor(0.1 * current.monetaryMass / current.membersCount);
      for(let i = 0; i < withUD.result.blocks.length; i++) {
        let bnum = withUD.result.blocks[i];
        let b = yield getBlock(bnum);
        amounts['D' + b.number] = b.dividend;
        UDt1 = Math.max(b.dividend, UDt1);
      }

      for(let i = 0; i < withTX.result.blocks.length; i++) {
        let bnum = withTX.result.blocks[i];
        let b = yield getBlock(bnum);
        for (let j = 0; j < b.transactions.length; j++) {
          let t = b.transactions[j];
          for (let k = 0; k < t.inputs.length; k++) {
            let input = t.inputs[k];
            let sp = input.split(':');
            let type = sp[0];
            let str = sp[1];
            let num = sp[2];
            let amount = 0;
            let pubkey;
            if (type == 'D') {
              amount = amounts['D' + num];
              pubkey = str;
            } else {
              amount = amounts[input].value;
              pubkey = amounts[input].pubkey;
            }
            accounts[pubkey] = accounts[pubkey] || { movements: [], uid: '' };
            accounts[pubkey].movements.push({
              type: 'TX',
              amount: -amount,
              block: bnum
            });
          }
          for (let k = 0; k < t.outputs.length; k++) {
            let output = t.outputs[k];
            let sp = output.split(':');
            let amount = parseInt(sp[0]);
            let base = sp[1];
            let condition = sp[2];
            let pubkey = condition.match(/^SIG\((\w+)\)$/)[1];
            let source = ['T', getTransactionHash(t), k].join(':');
            amounts[source] = amounts[source] || {};
            amounts[source].value = amount;
            amounts[source].pubkey = pubkey;
            accounts[pubkey] = accounts[pubkey] || { movements: [], uid: '' };
            accounts[pubkey].movements.push({
              type: 'TX',
              amount: amount,
              block: bnum
            });
          }
        }
      }
      // Newcomers UD not noted
      for(let i = 0; i < withNewcomers.result.blocks.length; i++) {
        let bnum = withNewcomers.result.blocks[i];
        // Change current UD
        let b = yield getBlock(bnum);
        for (let j = 0; j < b.identities.length; j++) {
          let idty = b.identities[j];
          let sp = idty.split(':');
          let pubkey = sp[0];
          let uid = sp[3];
          let ud_history = yield getUDHistory(pubkey);
          let uds = ud_history.history.history;
          for (let l = 0; l < uds.length; l++) {
            let ud = uds[l];
            accounts[pubkey] = accounts[pubkey] || { movements: [], uid: uid };
            accounts[pubkey].uid = accounts[pubkey].uid || uid;
            accounts[pubkey].movements.push({
              type: 'UD',
              amount: parseInt(ud.amount),
              block: ud.block_number
            });
          }
        }
      }

      if (filteringPubkey) {
        accounts[filteringPubkey] = accounts[filteringPubkey] || { movements: [], uid: '' };
      }

      let allKeys = _.keys(accounts);
      let columns = [];
      for (let k = 0, len = allKeys.length; k < len; k++) {
        let pubkey = allKeys[k];
        let balances = [];
        // let uid = accounts[pubkey].uid ? ' (' + accounts[pubkey].uid + ')' : '';
        // console.log('');
        // console.log('Account of %s %s', pubkey, uid);
        accounts[pubkey].movements = _.sortBy(accounts[pubkey].movements, (mov) => mov.block);

        let sum = 0;
        for(let i = 0; i < withUD.result.blocks.length; i++) {
          let bnum = withUD.result.blocks[i];
          let bnumPrev = withUD.result.blocks[i-1];
          let b = yield getBlock(bnum);
          let movs = _.filter(accounts[pubkey].movements, (mov) => {
            if (i == 0) {
              return false;
            }
            return mov.type == 'TX' && bnumPrev < mov.block && mov.block <= bnum;
          });
          movs.forEach((mov) => {
            sum += mov.amount;
          });
          balances.push(sum);
          // console.log('BalanceQ = %s ; UD = %s ; BalanceR = %s', sum, b.dividend, sum / b.dividend);
          let dividend = _.findWhere(accounts[pubkey].movements, { block: bnum, type: 'UD' });
          if (dividend) {
            sum += b.dividend;
          }
        }

        // We add the transactions after last UD
        let maxBnum = withUD.result.blocks[withUD.result.blocks.length - 1];
        let movs = _.filter(accounts[pubkey].movements, (mov) => mov.block > maxBnum);
        movs.forEach((mov) => {
          sum += mov.amount;
        });

        balances.push(sum);
        // console.log('BalanceQ = %s ; UD = %s ; BalanceR = %s', sum, UDt1, sum / UDt1);

        columns.push({
          pubkey: pubkey,
          key: accounts[pubkey].uid || 'pub_' + pubkey.slice(0,6),
          balances: balances
        })
      }

      if (filteringPubkey) {
        console.log(columns);
        columns = _.filter(columns, (col) => col.pubkey == filteringPubkey);
      }

      return {
        UDt1: UDt1,
        current: current,
        getBlock: getBlock,
        columns: columns,
        withUD: withUD
      };
    })
      .catch((err) => {
        console.error(err.stack);
      });

    function getTransactionHash(json) {
      return hashf(getRawTransaction(json)).toUpperCase();
    }

    function getRawTransaction(json) {
      let raw = "";
      raw += "Version: " + (json.version) + "\n";
      raw += "Type: Transaction\n";
      raw += "Currency: " + json.currency + "\n";
      raw += "Locktime: " + json.locktime + "\n";
      raw += "Issuers:\n";
      (json.issuers || []).forEach(function (issuer) {
        raw += issuer + '\n';
      });
      raw += "Inputs:\n";
      (json.inputs || []).forEach(function (input) {
        raw += input + '\n';
      });
      raw += "Unlocks:\n";
      (json.unlocks || []).forEach(function (input) {
        raw += input + '\n';
      });
      raw += "Outputs:\n";
      (json.outputs || []).forEach(function (output) {
        raw += output + '\n';
      });
      raw += "Comment: " + (json.comment || "") + "\n";
      (json.signatures || []).forEach(function (signature) {
        raw += signature + '\n';
      });
      return raw;
    }

    function hashf(str) {
      var bitArray = sjcl.hash.sha256.hash(str);
      var digest_sha256 = sjcl.codec.hex.fromBits(bitArray);
      return digest_sha256;
    }

    function getWithUD() {
      return readFromFileOrHttp('with_ud', '/blockchain/with/ud');
    }

    function getWithTX() {
      return readFromFileOrHttp('with_tx', '/blockchain/with/tx');
    }

    function getWithNewcomers() {
      return readFromFileOrHttp('with_newcomers', '/blockchain/with/newcomers');
    }

    function getBlock(number) {
      return readFromFileOrHttp('block_' + number, '/blockchain/block/' + number);
    }

    function getUDHistory(pubkey) {
      return readFromFileOrHttp('uds_' + pubkey, '/ud/history/' + pubkey);
    }

    function getCurrent() {
      return readFromFileOrHttp('current', '/blockchain/current');
    }

    function readFromFileOrHttp(filename, uri) {
      return co(function *() {
        if (memory[filename]) {
          return memory[filename];
        } else {
          console.log('>>>>> ' + uri);
          let content = yield getResource(uri);
          memory[filename] = content;
          localStorage.setItem('accounts', JSON.stringify(memory));
          return content;
        }
      });
    }
  }
};
