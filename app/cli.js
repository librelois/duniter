"use strict";

const co = require('co');
const logger = require('../app/lib/logger')('cli');
const async = require('async');
const Q = require('q');
const _ = require('underscore');
const program = require('commander');
const vucoin = require('vucoin');
const directory = require('../app/lib/system/directory');
const wizard = require('../app/lib/wizard');
const multicaster = require('../app/lib/streams/multicaster');
const keyring = require('../app/lib/crypto/keyring');
const base58 = require('../app/lib/crypto/base58');
const pjson = require('../package.json');
const duniter = require('../index');
const Peer = require('../app/lib/entity/peer');
const Block = require('../app/lib/entity/block');

let currentCommand = Promise.resolve(true);

let onResolve, onReject, closeCommand = () => Promise.resolve(true);

module.exports = (programArgs) => {

  currentCommand = new Promise((resolve, reject) => {
    onResolve = resolve;
    onReject = reject;
  });
  
  return {

    // Some external event can trigger the program closing function
    closeCommand: () => closeCommand(),

    // To execute the provided command
    execute: () => co(function*() {

      program.parse(programArgs);

      if (programArgs.length <= 2) {

        console.log('No command given, using default: duniter webwait');
        return co(function *() {
          try {
            yield webWait();
          } catch (e) {
            logger.error(e);
            throw Error("Exiting");
          }
        });
      }

      const res = yield currentCommand;
      if (closeCommand) {
        yield closeCommand();
      }
      return res;
    })
  };
};

function subCommand(promiseFunc) {
  return function() {
    let args = Array.prototype.slice.call(arguments, 0);
    return co(function*() {
      try {
        let result = yield promiseFunc.apply(null, args);
        onResolve(result);
      } catch (e) {
        logger.error(e);
        onReject(e);
      }
    })
  };
}

const ERASE_IF_ALREADY_RECORDED = true;
const NO_LOGS = true;

program
  .version(pjson.version)
  .usage('<command> [options]')

  .option('--home <path>', 'Path to Duniter HOME (defaults to "$HOME/.config/duniter").')
  .option('-d, --mdb <name>', 'Database name (defaults to "duniter_default").')

  .option('--autoconf', 'With `config` and `init` commands, will guess the best network and key options witout asking for confirmation')
  .option('--ipv4 <address>', 'IPv4 interface to listen for requests')
  .option('--ipv6 <address>', 'IPv6 interface to listen for requests')
  .option('--remoteh <host>', 'Remote interface others may use to contact this node')
  .option('--remote4 <host>', 'Remote interface for IPv4 access')
  .option('--remote6 <host>', 'Remote interface for IPv6 access')
  .option('-p, --port <port>', 'Port to listen for requests', parseInt)
  .option('--remotep <port>', 'Remote port others may use to contact this node')
  .option('--upnp', 'Use UPnP to open remote port')
  .option('--noupnp', 'Do not use UPnP to open remote port')

  // Webmin options
  .option('--webmhost <host>', 'Local network interface to connect to (IP)')
  .option('--webmport <port>', 'Local network port to connect', parseInt)

  .option('--salt <salt>', 'Key salt to generate this key\'s secret key')
  .option('--passwd <password>', 'Password to generate this key\'s secret key')
  .option('--participate <Y|N>', 'Participate to writing the blockchain')
  .option('--cpu <percent>', 'Percent of CPU usage for proof-of-work computation', parsePercent)

  .option('-c, --currency <name>', 'Name of the currency managed by this node.')
  .option('--sigPeriod <timestamp>', 'Minimum delay between 2 certifications of a same issuer, in seconds.')
  .option('--sigStock <count>', 'Maximum quantity of valid certifications per member.')
  .option('--sigWindow <duration>', 'Maximum age of a non-written certification.')
  .option('--idtyWindow <duration>', 'Maximum age of a non-written certification.')
  .option('--sigValidity <timestamp>', 'Validity duration of a certification, in seconds.')
  .option('--msValidity <timestamp>', 'Validity duration of a memberships, in seconds.')
  .option('--sigQty <number>', 'Minimum number of required certifications to be a member/stay as a member')
  .option('--medtblocks <number>', 'medianTimeBlocks parameter of UCP')
  .option('--avgGenTime <number>', 'avgGenTime parameter of UCP')
  .option('--dtdiffeval <number>', 'dtDiffEval parameter of UCP')
  .option('--powZeroMin <number>', 'Minimum number of leading zeros for a proof-of-work')
  .option('--powPeriod <number>', 'Number of blocks to wait to decrease proof-of-work difficulty by one')
  .option('--powDelay <number>', 'Number of seconds to wait before starting the computation of next block')
  .option('--growth <number>', 'Universal Dividend %growth. Aka. \'c\' parameter in RTM', parsePercent)
  .option('--ud0 <number>', 'Universal Dividend initial value')
  .option('--dt <number>', 'Number of seconds between two UD')
  .option('--rootoffset <number>', 'Allow to give a time offset for first block (offset in the past)')
  .option('--show', 'With gen-next or gen-root commands, displays the generated block')

  .option('--nointeractive', 'Disable interactive sync UI')
  .option('--nocautious', 'Do not check blocks validity during sync')
  .option('--cautious', 'Check blocks validity during sync (overrides --nocautious option)')
  .option('--nopeers', 'Do not retrieve peers during sync')
  .option('--nostdout', 'Disable stdout printing for `export-bc` command')

  .option('--timeout <milliseconds>', 'Timeout to use when contacting peers', parseInt)
  .option('--httplogs', 'Enable HTTP logs')
  .option('--nohttplogs', 'Disable HTTP logs')
  .option('--isolate', 'Avoid the node to send peering or status informations to the network')
  .option('--check', 'With gen-next: just check validity of generated block')
  .option('--forksize <size>', 'Maximum size of fork window', parseInt)
  .option('--memory', 'Memory mode')
;

program
  .command('start')
  .description('Start Duniter server.')
  .action(subCommand(service((server, conf) => new Promise((resolve, reject) => {
    co(function*() {
        try {
          yield duniter.statics.startNode(server, conf);
        } catch (e) {
          reject(e);
        }
    });
  }))));

program
  .command('webwait')
  .description('Start Duniter web admin.')
  .action(subCommand(webWait));

program
  .command('webstart')
  .description('Start Duniter web admin + immediately start the server.')
  .action(subCommand(webStart));

program
  .command('wizard [step]')
  .description('Launch the configuration Wizard')
  .action(subCommand(function (step) {
    // Only show message "Saved"
    return connect(function (step, server, conf) {
      return new Promise((resolve, reject) => {
        async.series([
          function (next) {
            startWizard(step, server, conf, next);
          }
        ], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    })(step, null);
  }));

program
  .command('sync [host] [port] [to]')
  .description('Synchronize blockchain from a remote Duniter node')
  .action(subCommand(service(function (host, port, to, server, conf) {
    if (!host) {
      throw 'Host is required.';
    }
    if (!port) {
      throw 'Port is required.';
    }
    return co(function *() {
      try {
        let cautious;
        if (program.nocautious) {
          cautious = false;
        }
        if (program.cautious) {
          cautious = true;
        }
        yield server.synchronize(host, port, parseInt(to), 0, !program.nointeractive, cautious, program.nopeers);
      } catch (err) {
        logger.error(err.stack || err.message);
      }
      yield ((server && server.disconnect()) || Q()).catch(() => null);
    });
  })));

program
  .command('peer [host] [port]')
  .description('Exchange peerings with another node')
  .action(subCommand(service(function (host, port, server) {
    return co(function *() {
      let node = yield Q.nfcall(vucoin, host, port);
      logger.info('Fetching peering record at %s:%s...', host, port);
      let peering = yield Q.nfcall(node.network.peering.get);
      logger.info('Apply peering ...');
      yield server.PeeringService.submitP(peering, ERASE_IF_ALREADY_RECORDED, !program.nocautious);
      logger.info('Applied');
      let selfPeer = yield server.dal.getPeer(server.PeeringService.pubkey);
      if (!selfPeer) {
        yield Q.nfcall(server.PeeringService.generateSelfPeer, server.conf, 0);
        selfPeer = yield server.dal.getPeer(server.PeeringService.pubkey);
      }
      logger.info('Send self peering ...');
      var caster = multicaster();
      yield caster.sendPeering(Peer.statics.peerize(peering), Peer.statics.peerize(selfPeer));
      logger.info('Sent.');
      yield server.disconnect();
    })
      .catch(function (err) {
        logger.error(err.code || err.message || err);
        throw Error("Exiting");
      });
  })));

program
  .command('init [host] [port]')
  .description('Setup a node configuration and sync data with given node')
  .action(subCommand(connect(bootstrapServer, true)));

program
  .command('dump [what]')
  .description('Diverse dumps of the inner data')
  .action(subCommand(connect(makeDump, true)));

program
  .command('forward [host] [port] [to]')
  .description('Forward local blockchain to a remote Duniter node')
  .action(subCommand(service(function (host, port, to, server) {

    var remoteCurrent;
    async.waterfall([
      function (next) {
        vucoin(host, port, next, {timeout: server.conf.timeout});
      },
      function (node, next) {
        node.blockchain.current().then(_.partial(next, null)).catch(next);
      },
      function (current, next) {
        remoteCurrent = current;
        logger.info(remoteCurrent.number);
        server.dal.getBlockFrom(remoteCurrent.number - 10).then(_.partial(next, null)).catch(next);
      },
      function (blocks, next) {
        blocks = _.sortBy(blocks, 'number');
        // Forward
        var peer = new Peer({
          endpoints: [['BASIC_MERKLED_API', host, port].join(' ')]
        });
        async.forEachSeries(blocks, function (block, callback) {
          logger.info("Forwarding block#" + block.number);
          server.dal.getBlock(block.number)
            .then(function (fullBlock) {
              multicaster(server.conf).sendBlock(peer, new Block(fullBlock)).then(() => callback()).catch(callback);
            });
        }, next);
      }
    ], function (err) {
      if (err) {
        logger.error('Error during forwarding:', err);
      }
      server.disconnect();
      throw Error("Exiting");
    });
  })));

program
  .command('revert [count]')
  .description('Revert (undo + remove) the top [count] blocks from the blockchain. EXPERIMENTAL')
  .action(subCommand(service(function (count, server) {
    return co(function *() {
      try {
        for (let i = 0; i < count; i++) {
          yield server.revert();
        }
      } catch (err) {
        logger.error('Error during revert:', err);
      }
      // Save DB
      server.disconnect()
        .catch(() => null)
        .then(function () {
          throw Error("Exiting");
        });
    });
  })));

program
  .command('revert-to [number]')
  .description('Revert (undo + remove) top blockchain blocks until block #[number] is reached. EXPERIMENTAL')
  .action(subCommand(service(function (number, server) {
    return co(function *() {
      try {
        yield server.revertTo(number);
      } catch (err) {
        logger.error('Error during revert:', err);
      }
      // Save DB
      ((server && server.disconnect()) || Q())
        .catch(() => null)
        .then(function () {
          throw Error("Exiting");
        });
    });
  })));

program
  .command('gen-next [host] [port] [difficulty]')
  .description('Tries to generate the next block of the blockchain')
  .action(subCommand(service(generateAndSend("generateNext"))));

program
  .command('gen-root [host] [port] [difficulty]')
  .description('Tries to generate root block, with choice of root members')
  .action(subCommand(service(generateAndSend("generateManualRoot"))));

function generateAndSend(generationMethod) {
  return function (host, port, difficulty, server, conf) {
    return new Promise((resolve, reject) => {
      async.waterfall([
        function (next) {
          var method = eval('server.BlockchainService.' + generationMethod);
          method().then(_.partial(next, null)).catch(next);
        },
        function (block, next) {
          if (program.check) {
            block.time = block.medianTime;
            program.show && console.log(block.getRawSigned());
            server.doCheckBlock(block)
              .then(function () {
                logger.info('Acceptable block');
                next();
              })
              .catch(next);
          }
          else {
            logger.debug('Block to be sent: %s', block.quickDescription());
            var wiz = wizard(server);
            async.waterfall([
              function (next) {
                if (!conf.salt && !conf.passwd)
                  wiz.configKey(conf, next);
                else
                  next();
              },
              function (next) {
                // Extract key pair
                keyring.scryptKeyPair(conf.salt, conf.passwd).then((pair) => next(null, pair)).catch(next);
              },
              function (pair, next) {
                proveAndSend(server, block, pair.publicKey, parseInt(difficulty), host, parseInt(port), next);
              }
            ], next);
          }
        }
      ], (err, data) => {
        err && reject(err);
        !err && resolve(data);
      });
    });
  };
}

function proveAndSend(server, block, issuer, difficulty, host, port, done) {
  var BlockchainService = server.BlockchainService;
  async.waterfall([
    function (next) {
      block.issuer = issuer;
      program.show && console.log(block.getRawSigned());
      BlockchainService.prove(block, difficulty).then((proven) => next(null, proven)).catch(next);
    },
    function (block, next) {
      var peer = new Peer({
        endpoints: [['BASIC_MERKLED_API', host, port].join(' ')]
      });
      program.show && console.log(block.getRawSigned());
      logger.info('Posted block ' + block.quickDescription());
      multicaster(server.conf).sendBlock(peer, block).then(() => next()).catch(next);
    }
  ], done);
}

program
  .command('export-bc [upto]')
  .description('Exports the whole blockchain as JSON array, up to [upto] block number (excluded).')
  .action(subCommand(service(function (upto, server) {
    return co(function *() {
      let CHUNK_SIZE = 500;
      let jsoned = [];
      let current = yield server.dal.getCurrentBlockOrNull();
      let lastNumber = current ? current.number + 1 : -1;
      if (upto !== undefined && upto.match(/\d+/)) {
        lastNumber = Math.min(parseInt(upto), lastNumber);
      }
      let chunksCount = Math.floor(lastNumber / CHUNK_SIZE);
      let chunks = [];
      // Max-size chunks
      for (let i = 0, len = chunksCount; i < len; i++) {
        chunks.push({start: i * CHUNK_SIZE, to: i * CHUNK_SIZE + CHUNK_SIZE - 1});
      }
      // A last chunk
      if (lastNumber > chunksCount * CHUNK_SIZE) {
        chunks.push({start: chunksCount * CHUNK_SIZE, to: lastNumber});
      }
      for (const chunk of chunks) {
        let blocks = yield server.dal.getBlocksBetween(chunk.start, chunk.to);
        blocks.forEach(function (block) {
          jsoned.push(_(new Block(block).json()).omit('raw'));
        });
      }
      if (!program.nostdout) {
        console.log(JSON.stringify(jsoned, null, "  "));
      }
      yield server.disconnect();
      return jsoned;
    })
      .catch(function (err) {
        logger.warn(err.message || err);
        server.disconnect()
          .catch(() => null)
          .then(function () {
            throw Error(err);
          });
      });
  }, NO_LOGS)));

program
  .command('check-config')
  .description('Checks the node\'s configuration')
  .action(subCommand(service(function (server) {
    server.checkConfig()
      .then(function () {
        logger.warn('Configuration seems correct.');
        server.disconnect();
        throw Error("Exiting");
      })
      .catch(function (err) {
        logger.warn(err.message || err);
        server.disconnect();
        throw Error("Exiting");
      });
  })));

program
  .command('config')
  .description('Register configuration in database')
  .action(subCommand(connect(function (server, conf) {
    return co(function *() {
      if (program.autoconf) {
        let wiz = wizard();
        conf.upnp = !program.noupnp;
        yield Q.nbind(wiz.networkReconfiguration, wiz)(conf, program.autoconf, program.noupnp);
        yield Q.nbind(wiz.keyReconfigure, wiz)(conf, program.autoconf);
      }
      return server.dal.saveConf(conf)
        .then(function () {
          logger.debug("Configuration saved.");
          return conf;
        })
        .catch(function (err) {
          logger.error("Configuration could not be saved: " + err);
          throw Error(err);
        });
    });
  })));

program
  .command('reset [config|data|peers|tx|stats|all]')
  .description('Reset configuration, data, peers, transactions or everything in the database')
  .action(subCommand((type) => {
    let init = ['data', 'all'].indexOf(type) !== -1 ? server : connect;
    return init(function (server) {
      if (!~['config', 'data', 'peers', 'stats', 'all'].indexOf(type)) {
        throw Error('Bad command: usage `reset config`, `reset data`, `reset peers`, `reset stats` or `reset all`');
      }
      return co(function*() {
        try {
          if (type == 'data') {
            yield server.resetData();
            logger.warn('Data successfully reseted.');
          }
          if (type == 'peers') {
            yield server.resetPeers();
            logger.warn('Peers successfully reseted.');
          }
          if (type == 'stats') {
            yield server.resetStats();
            logger.warn('Stats successfully reseted.');
          }
          if (type == 'config') {
            yield server.resetConf();
            logger.warn('Configuration successfully reseted.');
          }
          if (type == 'all') {
            yield server.resetAll();
            logger.warn('Data & Configuration successfully reseted.');
          }
        } catch (e) {
          logger.error(e);
        }
        return server.disconnect();
      });
    }, type != 'peers')(type);
  }));

function startWizard(step, server, conf, done) {
  var wiz = wizard(server);
  var task = {
    'currency': wiz.configCurrency,
    'basic': wiz.configBasic,
    'pow': wiz.configPoW,
    'network': wiz.configNetwork,
    'network-reconfigure': wiz.configNetworkReconfigure,
    'key': wiz.configKey,
    'ucp': wiz.configUCP
  };
  var wizDo = task[step] || wiz.configAll;
  async.waterfall([
    function (next) {
      wizDo(conf, next);
    },
    function (next) {
      return server.dal.saveConf(conf)
        .then(function () {
          logger.debug("Configuration saved.");
          next();
        })
        .catch(next);
    },
    function (next) {
      // Check config
      service(function (key, server, conf) {
        next();
      })(null, null);
    }
  ], done);
}

function makeDump(what, server, conf) {
  return co(function *() {
    try {
      server.dal.wotb.showWoT();
    } catch (e) {
      logger.error(e);
    }
    server.disconnect();
    throw Error("Exiting");
  });
}

function bootstrapServer(host, port, server, conf) {
  async.series(getBootstrapOperations(host, port, server, conf), function (err) {
    if (err) {
      logger.error(err);
    }
    server.disconnect();
    throw Error("Exiting");
  });
}

function getBootstrapOperations(host, port, server, conf) {
  var ops = [];
  var wiz = wizard(server);
  ops = ops.concat([
    function (next) {
      // Reset data
      server.resetAll(next);
    },
    function (next) {
      conf.upnp = !program.noupnp;
      wiz.networkReconfiguration(conf, program.autoconf, program.noupnp, next);
    },
    function (next) {
      // PublicKey
      var keyChosen = true;
      async.doWhilst(function (next) {
        async.waterfall([
          function (next) {
            if (!conf.salt && !conf.passwd) {
              wiz.keyReconfigure(conf, program.autoconf, next);
            } else {
              next();
            }
          }
        ], next);
      }, function () {
        return !keyChosen;
      }, next);
    },
    function (next) {
      return server.dal.saveConf(conf).then(_.partial(next, null)).catch(next);
    }]);
  ops.push(function (next) {
    logger.info('Configuration saved.');
    next();
  });
  return ops;
}

function commandLineConf(conf) {

  conf = conf || {};
  conf.sync = conf.sync || {};
  var cli = {
    currency: program.currency,
    cpu: program.cpu,
    server: {
      port: program.port,
      ipv4address: program.ipv4,
      ipv6address: program.ipv6,
      salt: program.salt,
      passwd: program.passwd,
      remote: {
        host: program.remoteh,
        ipv4: program.remote4,
        ipv6: program.remote6,
        port: program.remotep
      }
    },
    db: {
      mport: program.mport,
      mdb: program.mdb,
      home: program.home
    },
    net: {
      upnp: program.upnp,
      noupnp: program.noupnp
    },
    logs: {
      http: program.httplogs,
      nohttp: program.nohttplogs
    },
    ucp: {
      rootoffset: program.rootoffset,
      sigPeriod: program.sigPeriod,
      sigStock: program.sigStock,
      sigWindow: program.sigWindow,
      idtyWindow: program.idtyWindow,
      msWindow: program.msWindow,
      sigValidity: program.sigValidity,
      sigQty: program.sigQty,
      msValidity: program.msValidity,
      powZeroMin: program.powZeroMin,
      powPeriod: program.powPeriod,
      powDelay: program.powDelay,
      participate: program.participate,
      ud0: program.ud0,
      c: program.growth,
      dt: program.dt,
      incDateMin: program.incDateMin,
      medtblocks: program.medtblocks,
      dtdiffeval: program.dtdiffeval,
      avgGenTime: program.avgGenTime
    },
    isolate: program.isolate,
    forksize: program.forksize,
    nofork: program.nofork,
    timeout: program.timeout
  };

  // Update conf
  if (cli.currency)                         conf.currency = cli.currency;
  if (cli.server.ipv4address)               conf.ipv4 = cli.server.ipv4address;
  if (cli.server.ipv6address)               conf.ipv6 = cli.server.ipv6address;
  if (cli.server.port)                      conf.port = cli.server.port;
  if (cli.server.salt)                      conf.salt = cli.server.salt;
  if (cli.server.passwd != undefined)       conf.passwd = cli.server.passwd;
  if (cli.server.remote.host != undefined)  conf.remotehost = cli.server.remote.host;
  if (cli.server.remote.ipv4 != undefined)  conf.remoteipv4 = cli.server.remote.ipv4;
  if (cli.server.remote.ipv6 != undefined)  conf.remoteipv6 = cli.server.remote.ipv6;
  if (cli.server.remote.port != undefined)  conf.remoteport = cli.server.remote.port;
  if (cli.ucp.rootoffset)                   conf.rootoffset = cli.ucp.rootoffset;
  if (cli.ucp.sigPeriod)                    conf.sigPeriod = cli.ucp.sigPeriod;
  if (cli.ucp.sigStock)                     conf.sigStock = cli.ucp.sigStock;
  if (cli.ucp.sigWindow)                    conf.sigWindow = cli.ucp.sigWindow;
  if (cli.ucp.idtyWindow)                   conf.idtyWindow = cli.ucp.idtyWindow;
  if (cli.ucp.msWindow)                     conf.msWindow = cli.ucp.msWindow;
  if (cli.ucp.sigValidity)                  conf.sigValidity = cli.ucp.sigValidity;
  if (cli.ucp.msValidity)                   conf.msValidity = cli.ucp.msValidity;
  if (cli.ucp.sigQty)                       conf.sigQty = cli.ucp.sigQty;
  if (cli.ucp.msValidity)                   conf.msValidity = cli.ucp.msValidity;
  if (cli.ucp.powZeroMin)                   conf.powZeroMin = cli.ucp.powZeroMin;
  if (cli.ucp.powPeriod)                    conf.powPeriod = cli.ucp.powPeriod;
  if (cli.ucp.powDelay)                     conf.powDelay = cli.ucp.powDelay;
  if (cli.ucp.participate)                  conf.participate = cli.ucp.participate == 'Y';
  if (cli.ucp.dt)                           conf.dt = cli.ucp.dt;
  if (cli.ucp.c)                            conf.c = cli.ucp.c;
  if (cli.ucp.ud0)                          conf.ud0 = cli.ucp.ud0;
  if (cli.ucp.incDateMin)                   conf.incDateMin = cli.ucp.incDateMin;
  if (cli.ucp.medtblocks)                   conf.medianTimeBlocks = cli.ucp.medtblocks;
  if (cli.ucp.avgGenTime)                   conf.avgGenTime = cli.ucp.avgGenTime;
  if (cli.ucp.dtdiffeval)                   conf.dtDiffEval = cli.ucp.dtdiffeval;
  if (cli.net.upnp)                         conf.upnp = true;
  if (cli.net.noupnp)                       conf.upnp = false;
  if (cli.cpu)                              conf.cpu = Math.max(0.01, Math.min(1.0, cli.cpu));
  if (cli.logs.http)                        conf.httplogs = true;
  if (cli.logs.nohttp)                      conf.httplogs = false;
  if (cli.db.mport)                         conf.mport = cli.db.mport;
  if (cli.db.home)                          conf.home = cli.db.home;
  if (cli.db.mdb)                           conf.mdb = cli.db.mdb;
  if (cli.isolate)                          conf.isolate = cli.isolate;
  if (cli.timeout)                          conf.timeout = cli.timeout;
  if (cli.forksize != null)                 conf.forksize = cli.forksize;

  // Specific internal settings
  conf.createNext = true;
  return _(conf).extend({routing: true});
}

function connect(callback, useDefaultConf) {
  return function () {
    var cbArgs = arguments;
    var dbName = program.mdb || "duniter_default";
    var dbHome = program.home;

    var server = duniter({home: dbHome, name: dbName}, commandLineConf());

    // If ever the process gets interrupted
    let isSaving = false;
    closeCommand = () => co(function*() {
      if (!isSaving) {
        isSaving = true;
        // Save DB
        return server.disconnect();
      }
    });

    // Initialize server (db connection, ...)
    return server.plugFileSystem(useDefaultConf)
      .then(() => server.loadConf())
      .then(function () {
        cbArgs.length--;
        cbArgs[cbArgs.length++] = server;
        cbArgs[cbArgs.length++] = server.conf;
        return callback.apply(this, cbArgs);
      })
      .catch(function (err) {
        server.disconnect();
        throw Error(err);
      });
  };
}

/**
 * Super basic server with only its home path set
 * @param callback
 * @param useDefaultConf
 * @returns {Function}
 */
function server(callback, useDefaultConf) {
  return function () {
    var cbArgs = arguments;
    var dbName = program.mdb || "duniter_default";
    var dbHome = program.home;

    var server = duniter({home: dbHome, name: dbName}, commandLineConf());

    cbArgs.length--;
    cbArgs[cbArgs.length++] = server;
    cbArgs[cbArgs.length++] = server.conf;
    return callback.apply(this, cbArgs);
  };
}

function service(callback, nologs) {

  return function () {

    if (nologs) {
      // Disable logs
      require('../app/lib/logger')().mute();
    }

    var cbArgs = arguments;
    var dbName = program.mdb;
    var dbHome = program.home;

    // Add log files for this instance
    logger.addHomeLogs(directory.getHome(dbName, dbHome));

    var server = duniter({home: dbHome, name: dbName, memory: program.memory}, commandLineConf());

    // If ever the process gets interrupted
    let isSaving = false;
    closeCommand = () => co(function*() {
      if (!isSaving) {
        isSaving = true;
        // Save DB
        return server.disconnect();
      }
    });

    // Initialize server (db connection, ...)
    return server.initWithDAL()
      .then(function () {
        cbArgs.length--;
        cbArgs[cbArgs.length++] = server;
        cbArgs[cbArgs.length++] = server.conf;
        return callback.apply(this, cbArgs);
      })
      .catch(function (err) {
        logger.error(err);
        server.disconnect();
        throw Error(err);
      });
  };
}

function logIfErrorAndExit(server, prefix) {
  return function (err) {
    if (err && err.uerr) {
      err = err.uerr.message;
    }
    err && logger.error((prefix ? prefix : "") + (err.message || err));
    server.disconnect();
    onResolve && onResolve();
  };
}

function parsePercent(s) {
  var f = parseFloat(s);
  return isNaN(f) ? 0 : f;
}

program
  .on('*', function (cmd) {
    console.log("Unknown command '%s'. Try --help for a listing of commands & options.", cmd);
    throw Error("Exiting");
  });

function webWait() {
  return new Promise(() => {
    co(function *() {
      let webminapi = yield webInit();
      yield webminapi.httpLayer.openConnections();
      yield new Promise(() => null); // Never stop this command, unless Ctrl+C
    })
      .catch(mainError);
  });
}

function webStart() {
  return co(function *() {
    let webminapi = yield webInit();
    yield webminapi.httpLayer.openConnections();
    yield webminapi.webminCtrl.startHTTP();
    yield webminapi.webminCtrl.startAllServices();
    yield webminapi.webminCtrl.regularUPnP();
    yield new Promise(() => null); // Never stop this command, unless Ctrl+C
  })
    .catch(mainError);
}

function webInit() {
  return co(function *() {
    var dbName = program.mdb;
    var dbHome = program.home;
    if (!program.memory) {
      let params = yield directory.getHomeFS(program.memory, dbHome);
      yield directory.createHomeIfNotExists(params.fs, params.home);

      // Add log files for this instance
      logger.addHomeLogs(params.home);
    }
    return yield duniter.statics.enableHttpAdmin({
      home: dbHome,
      name: dbName,
      memory: program.memory
    }, commandLineConf(), false, program.webmhost, program.webmport);
  });
}

function mainError(err) {
  if (err.stack) {
    logger.error(err.stack);
  }
  logger.error(err.code || err.message || err);
  throw Error("Exiting");
}
