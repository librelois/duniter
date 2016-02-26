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
      template: require('views/configure/choose'),
      controller: () => {
        console.log('aijjjij');
      }
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
