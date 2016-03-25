var co = require('co');
var _ = require('underscore');

module.exports = (app) => {

  app.config(['$stateProvider', '$urlRouterProvider', ($stateProvider, $urlRouterProvider) => {

    // States
    $stateProvider.
    state('index', {
      url: '/',
      template: require('views/index'),
      controller: 'IndexController'
    }).

    state('configure', {
      abstract: true,
      url: '/configure',
      template: require('views/init/layout'),
      controller: ($scope) => {
        $scope.conf = {
          currency: 'super_currency',
          c: 0.007376575,
          dt: 30.4375 * 24 * 3600,
          ud0: 100,
          stepMax: 3,
          sigDelay: 3600 * 24 * 365 * 5,
          sigPeriod: 0, // Instant
          sigStock: 40,
          sigWindow: 3600 * 24 * 14, // 2 weeks
          sigValidity: 3600 * 24 * 365,
          msValidity: 3600 * 24 * 365,
          sigQty: 0,
          xpercent: 0.9,
          percentRot: 0.66,
          blocksRot: 20,
          avgGenTime: 16 * 60,
          dtDiffEval: 10,
          medianTimeBlocks: 20
        };
      }
    }).

    state('configure.choose', {
      url: '/choose',
      template: require('views/init/choose')
    }).

    state('configure.create', {
      url: '/create',
      template: '<div class="ui-scrollable" ui-view=""></div>'
    }).

    state('configure.create.uid', {
      url: '/create/uid',
      template: require('views/init/create/create_uid'),
      controller: 'IdentityController'
    }).

    state('configure.create.network', {
      url: '/create/network',
      template: require('views/init/create/create_network'),
      resolve: {
        netinterfaces: (BMA) => resolveNetworkAutoConf(BMA),
        firstConf: () => true
      },
      controller: 'NetworkController'
    }).

    state('configure.create.parameters', {
      url: '/create/parameters',
      template: require('views/init/create/create_parameters'),
      controller: 'ParametersController'
    }).

    state('configure.create.root', {
      url: '/create/root',
      template: require('views/init/create/create_root'),
      controller: 'RootBlockController'
    }).

    state('sync', {
      url: '/sync?host=&port=&sync=&to=',
      template: require('views/init/sync/sync'),
      controller: 'SyncController'
    }).

    state('main', {
      abstract: true,
      url: '/main',
      template: require('views/main/main'),
      resolve: {
        ws: (BMA) => BMA.webmin.ws()
      },
      controller: 'MainController'
    }).

    state('main.home', {
      abstract: true,
      url: '/home',
      template: require('views/main/home/home'),
      controller: 'HomeController'
    }).

    state('main.home.overview', {
      url: '/overview',
      template: require('views/main/home/tabs/overview'),
      resolve: {
        summary: (BMA) => BMA.webmin.summary(),
        startHttp: (BMA) => BMA.webmin.server.http.start(),
        bmapi: (BMA, summary) => co(function *() {
          return BMA.instance(summary.host);
        }),
        parameters: (bmapi) => bmapi.currency.parameters()
      },
      controller: 'OverviewController'
    }).

    state('main.home.logs', {
      url: '/logs',
      template: require('views/main/home/tabs/logs'),
      controller: 'LogsController'
    }).

    state('main.settings', {
      abstract: true,
      url: '/settings',
      template: require('views/main/settings/settings'),
      resolve: {
        summary: (BMA) => BMA.webmin.summary(),
        bmapi: (BMA, summary) => co(function *() {
          return BMA.instance(summary.host);
        })
      },
      controller: 'SettingsController'
    }).

    state('main.settings.data', {
      url: '/data',
      template: require('views/main/settings/tabs/data'),
      resolve: {
        peers: (bmapi) => co(function *() {
          try {
            let self = yield bmapi.network.peering.self();
            let res = yield bmapi.network.peers();
            return _.filter(res.peers, (p) => p.pubkey != self.pubkey);
          } catch (e) {
            return [];
          }
        })
      },
      controller: 'DataController'
    }).

    state('main.settings.crypto', {
      url: '/crypto',
      template: require('views/main/settings/tabs/crypto'),
      controller: 'KeyController'
    }).

    state('main.settings.network', {
      url: '/network',
      resolve: {
        netinterfaces: (BMA) => resolveNetworkAutoConf(BMA),
        firstConf: () => false
      },
      template: require('views/main/settings/tabs/network'),
      controller: 'NetworkController'
    }).

    state('main.settings.currency', {
      url: '/currency',
      resolve: {
        conf: (bmapi) => co(function *() {
          return bmapi.currency.parameters();
        })
      },
      template: require('views/main/settings/tabs/currency'),
      controller: 'CurrencyController'
    }).

    state('main.graphs', {
      abstract: true,
      url: '/graphs',
      template: require('views/main/graphs/graphs'),
      controller: 'GraphsController'
    }).

    state('main.graphs.blockchain', {
      url: '/blockchain',
      template: require('views/main/graphs/blockchain'),
      controller: 'GraphsBlockchainController'
    }).

    //state('graphs.crypto', {
    //  url: '/crypto',
    //  template: require('views/graphs/crypto'),
    //  controller: 'KeyController'
    //}).
    //
    //state('graphs.network', {
    //  url: '/network',
    //  resolve: {
    //    netinterfaces: (BMA) => resolveNetworkAutoConf(BMA),
    //    firstConf: () => false
    //  },
    //  template: require('views/graphs/network'),
    //  controller: 'NetworkController'
    //}).
    //
    //state('graphs.currency', {
    //  url: '/currency',
    //  resolve: {
    //    conf: (bmapi) => co(function *() {
    //      return bmapi.currency.parameters();
    //    })
    //  },
    //  template: require('views/graphs/currency'),
    //  controller: 'CurrencyController'
    //}).

    state('error', {
      url: '/error\?err',
      template: require('views/error'),
      controller: ($scope, $stateParams) =>
        $scope.errorMsg = $stateParams.err || 'err.unknown'
    });

    // Default route
    $urlRouterProvider.otherwise('/');
  }]);

  function resolveNetworkAutoConf(BMA) {
    return co(function *() {
      let netinterfaces = yield BMA.webmin.network.interfaces();
      return netinterfaces || { local: {}, remote: {} };
    });
  }
};
