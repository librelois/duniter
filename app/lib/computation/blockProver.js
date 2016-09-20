"use strict";
const async           = require('async');
const co              = require('co');
const Q               = require('q');
const constants       = require('../constants');
const base58          = require('../crypto/base58');
const childProcess    = require('child_process');
const path            = require('path');
const Block           = require('../entity/block');

module.exports = (server) => new BlockGenerator(server);

function BlockGenerator(notifier) {

  let conf, pair, logger;

  this.setConfDAL = (newConf, newDAL, newPair) => {
    conf = newConf;
    pair = newPair;
    logger = require('../logger')('prover');
  };

  const cancels = [];

  const debug = process.execArgv.toString().indexOf('--debug') !== -1;
  if(debug) {
    //Set an unused port number.
    process.execArgv = [];
  }
  let powWorker;

  const powFifo = async.queue(function (task, callback) {
    task(callback);
  }, 1);

  // Callback used to start again computation of next PoW
  let computeNextCallback = null;

  // Flag indicating the PoW has begun
  let computing = false;

  this.computing = () => computing = true;

  this.notComputing = () => computing = false;

  this.waitForContinue = () => Q.Promise(function(resolve){
    computeNextCallback = resolve;
  });

  this.cancel = () => {
    // If PoW computation process is waiting, trigger it
    if (computeNextCallback)
      computeNextCallback();
    if (conf.participate && !cancels.length && computing) {
      powFifo.push(function (taskDone) {
        cancels.push(taskDone);
      });
    }
  };

  this.waitBeforePoW = () => Q.Promise(function(resolve, reject){
    const timeoutToClear = setTimeout(function() {
      clearTimeout(timeoutToClear);
      computeNextCallback = null;
      resolve();
    }, (conf.powDelay) * 1000);
    // Offer the possibility to break waiting
    computeNextCallback = function() {
      clearTimeout(timeoutToClear);
      reject('Waiting canceled.');
    };
  });

  this.prove = function (block, difficulty, forcedTime) {

    const remainder = difficulty % 16;
    const nbZeros = (difficulty - remainder) / 16;
    const highMark = constants.PROOF_OF_WORK.UPPER_BOUND[remainder];

    return Q.Promise(function(resolve, reject){
      if (!powWorker) {
        powWorker = new Worker();
      }
      if (block.number == 0) {
        // On initial block, difficulty is the one given manually
        block.powMin = difficulty;
      }
      // Start
      powWorker.setOnPoW(function(err, powBlock) {
        const theBlock = (powBlock && new Block(powBlock)) || null;
        if (theBlock) {
          // We found it
          powEvent(true, theBlock.hash);
        } else {
          powEvent(true, '');
        }
        logger.info('FOUND proof-of-work with %s leading zeros followed by [0-' + highMark + ']!', nbZeros);
        resolve(theBlock);
      });

      powWorker.setOnError((err) => {
        reject(err);
      });

      block.nonce = 0;
      powWorker.powProcess.send({ conf: conf, block: block, zeros: nbZeros, highMark: highMark, forcedTime: forcedTime,
        pair: pair.json()
      });
      logger.info('Generating proof-of-work with %s leading zeros followed by [0-' + highMark + ']... (CPU usage set to %s%)', nbZeros, (conf.cpu * 100).toFixed(0));
    });
  };

  function powEvent(found, hash) {
    notifier && notifier.push({ pow: { found, hash } });
  }

  function Worker() {

    const that = this;
    let onPoWFound = function() { throw 'Proof-of-work found, but no listener is attached.'; };
    let onPoWError = function() { throw 'Proof-of-work error, but no listener is attached.'; };
    that.powProcess = childProcess.fork(path.join(__dirname, '../proof.js'));
    const start = Date.now();
    let stopped = false;

    that.powProcess.on('message', function(msg) {
      const block = msg.block;
      if (msg.error) {
        onPoWError(msg.error);
        stopped = true;
      }
      if (!stopped && msg.found) {
        const duration = (Date.now() - start);
        const testsPerSecond = (msg.testsCount / (duration / 1000)).toFixed(2);
        logger.info('Done: %s in %ss (%s tests, ~%s tests/s)', msg.pow, (duration / 1000).toFixed(2), msg.testsCount, testsPerSecond);
        stopped = true;
        block.hash = msg.pow;
        onPoWFound(null, block);
        that.powProcess.kill();
        powWorker = new Worker();
      } else if (!stopped) {

        if (!msg.found) {
          const pow = msg.pow;
          const matches = pow.match(/^(0{2,})[^0]/);
          if (matches) {
            // We log only proof with at least 3 zeros
            powEvent(false, pow);
            if (matches && matches[1].length >= constants.PROOF_OF_WORK.MINIMAL_TO_SHOW) {
              logger.info('Matched %s zeros %s with Nonce = %s for block#%s', matches[1].length, pow, msg.block.nonce, msg.block.number);
            }
          }
        }
        // Continue...
        //console.log('Already made: %s tests...', msg.nonce);
        // Look for incoming block
        if (cancels.length) {
          stopped = true;
          that.powProcess.kill();
          that.powProcess = null;
          powWorker = null;
          onPoWFound();
          logger.debug('Proof-of-work computation canceled.');
          const cancelConfirm = cancels.shift();
          cancelConfirm();
        }
      }
    });

    this.kill = function() {
      if (that.powProcess) {
        that.powProcess.kill();
        that.powProcess = null;
      }
    };

    this.setOnPoW = function(onPoW) {
      onPoWFound = onPoW;
    };

    this.setOnError = function(onError) {
      onPoWError = onError;
    };
  }
}
