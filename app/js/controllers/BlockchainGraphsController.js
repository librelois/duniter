"use strict";

const BLOCKS_COUNT = 40;

var co = require('co');

module.exports = ($scope, $state, BMA, UIUtils, Graph) => {

  $scope.blocksCount = $scope.blocksCount || BLOCKS_COUNT;

  $scope.updateGraphs = () => {
    return co(function *() {
      let summary = yield BMA.webmin.summary();
      let bmapi = BMA.instance(summary.host);
      let parameters = yield bmapi.currency.parameters();
      let blocks = yield bmapi.blockchain.blocks({
        count: $scope.blocksCount,
        from: Math.max(0, summary.current.number - $scope.blocksCount)
      });
      let speeds = [], accelerations = [], medianTimeIncrements = [], actualDurations = [];
      let BY_HOUR = 3600;
      for (let i = 0, len = blocks.length; i < len; i++) {
        let block = blocks[i];
        let acc = 0;
        let previousPos = Math.max(0, i - parameters.dtDiffEval);
        for (let j = previousPos; j < i; j++) {
          acc += (blocks[j+1].medianTime - blocks[j].medianTime);
        }
        let availPreviousBlocks = i - 1 - previousPos;
        let localAvgSpeed = acc / (availPreviousBlocks || 1);
        let realDuration = !isNaN(localAvgSpeed) && localAvgSpeed != 0 ? localAvgSpeed : parameters.avgGenTime;
        actualDurations.push(parseFloat((realDuration).toFixed(2)));
        speeds.push(parseFloat((BY_HOUR/realDuration).toFixed(2)));
        accelerations.push(block.time - block.medianTime);
        medianTimeIncrements.push(block.medianTime - (i ? blocks[i-1].medianTime : block.medianTime));
      }
      let minSpeeds = speeds.map(() => parseFloat((BY_HOUR/Math.ceil(parameters.avgGenTime * Math.sqrt(1.066))).toFixed(2)));
      let maxSpeeds = speeds.map(() => parseFloat((BY_HOUR/Math.floor(parameters.avgGenTime / Math.sqrt(1.066))).toFixed(2)));
      let minDurations = speeds.map(() => parseFloat(((parameters.avgGenTime / 1.066)).toFixed(2)));
      let maxDurations = speeds.map(() => parseFloat(((parameters.avgGenTime * 1.066)).toFixed(2)));
      let difficulties = blocks.map((b) => b.powMin);

      setTimeout(() => {
        Graph.timeGraphs('#timeGraph', Math.max(0, summary.current.number - $scope.blocksCount + 1), accelerations, medianTimeIncrements, actualDurations, minDurations, maxDurations);

        setTimeout(() => {
          Graph.speedGraph('#speedGraph', Math.max(0, summary.current.number - $scope.blocksCount), speeds, minSpeeds, maxSpeeds, (series) => {
            $scope.series = series;
          });
        }, 1000);

        setTimeout(() => {
          Graph.difficultyGraph('#difficultyGraph', Math.max(0, summary.current.number - $scope.blocksCount), difficulties);
        }, 1000);
      }, 100);
    });
  };

  setTimeout(() => $scope.updateGraphs(), 300);
};
