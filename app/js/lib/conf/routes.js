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
      template: require('views/configure/layout'),
      controller: ($scope) => {
        console.log('Abstract');
        $scope.conf = {
          idty_uid: 'cgeek',
          idty_entropy: 'cat',
          idty_password: 'tac',
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
          sigQty: 5,
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
      template: require('views/configure/choose')
    }).

    state('configure.create_uid', {
      url: '/create/uid',
      template: require('views/configure/create_uid'),
      controller: 'IdentityController'
    }).

    state('configure.create_network', {
      url: '/create/network',
      template: require('views/configure/create_network'),
      controller: 'NetworkController'
    }).

    state('configure.create_parameters', {
      url: '/create/parameters',
      template: require('views/configure/create_parameters'),
      controller: 'ParametersController'
    }).

    state('configure.create_root', {
      url: '/create/root',
      template: require('views/configure/create_root'),
      controller: 'RootBlockController'
    }).

    state('home', {
      url: '/',
      template: require('views/home'),
      controller: 'HomeController'
    }).

    state('error', {
      url: '/error\?err',
      template: require('views/error'),
      controller: ($scope, $stateParams) =>
        $scope.errorMsg = $stateParams.err || 'err.unknown'
    });

    // Default route
    $urlRouterProvider.otherwise('/');
  }]);
};
