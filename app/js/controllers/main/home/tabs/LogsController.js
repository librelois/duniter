"use strict";

module.exports = ($scope, ws, UIUtils) => {

  UIUtils.enableTabs();

  let co = require('co');
  let _ = require('underscore');

  $scope.logsSize = 100;
  $scope.logs = _.range(0, $scope.logsSize).map(() => "");
  $scope.logsString = "";
  $scope.follow = true;

  $scope.$watch('logsSize', () => {
    addLogs({ value: [] }, true);
  });

  ws.on('log', addLogs);

  function addLogs(res, autoDigest) {

    if (!$scope.pause) {
      let newlogs = res.value;
      // Add at max LOGS_FLOW_SIZE new lines
      newlogs.splice(0, Math.max(0, newlogs.length - $scope.logsSize));
      // Add just enough space for incoming logs
      $scope.logs.splice(0, Math.max(0, $scope.logs.length + newlogs.length - $scope.logsSize));
      for (let i = 0, len = newlogs.length; i < len; i++) {
        let log = newlogs[i];
        $scope.logs.push(log.msg);
      }
      $scope.logsString = $scope.logs.join('\n');
      if (!autoDigest) {
        $scope.$apply();
      }
    }

    if ($scope.follow) {
      var elem = document.getElementById('logs');
      if (elem) {
        elem.scrollTop = elem.scrollHeight;
      }
    }
  }

  return co(function *() {
    yield ws.whenOpened();
    ws.send();
  });
};
