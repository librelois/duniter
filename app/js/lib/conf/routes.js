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
      template: require('views/configure/layout')
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
      template: require('views/configure/create_parameters')
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
