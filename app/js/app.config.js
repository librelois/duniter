module.exports = () => {

  require('./services/bma')(angular);

  var duniterApp = angular.module('duniterUIApp', [
    'ui.router',
    'homeControllers',
    'pascalprecht.translate'
  ]);

  require('./lib/conf/translate')(duniterApp);
  require('./lib/conf/routes')(duniterApp);

  let homeControllers = angular.module('homeControllers', ['duniter.services']);

  homeControllers.controller('HomeController', require('./controllers/HomeController'));
  homeControllers.controller('IndexController', require('./controllers/IndexController'));
  homeControllers.controller('IdentityController', require('./controllers/IdentityController'));
  homeControllers.controller('NetworkController', require('./controllers/NetworkController'));
  homeControllers.controller('ParametersController', require('./controllers/ParametersController'));
};
