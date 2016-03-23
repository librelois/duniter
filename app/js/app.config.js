module.exports = () => {

  require('./services/bma')(angular);

  var duniterApp = angular.module('duniterUIApp', [
    'ui.router',
    'homeControllers',
    'pascalprecht.translate'
  ]);

  require('./lib/conf/translate')(duniterApp);
  require('./lib/conf/routes')(duniterApp);
  require('js/services/datetime')(duniterApp);
  require('js/services/ui_utils')(duniterApp);
  require('js/services/graphs')(duniterApp);
  require('js/services/pubkeyGenerator')(duniterApp);

  let homeControllers = angular.module('homeControllers', ['duniter.services']);

  homeControllers.controller('MainController', require('./controllers/main/MainController'));
  homeControllers.controller('HomeController', require('./controllers/main/home/HomeController'));
  homeControllers.controller('IndexController', require('./controllers/IndexController'));
  homeControllers.controller('IdentityController', require('./controllers/init/create/IdentityController'));
  homeControllers.controller('NetworkController', require('./controllers/main/settings/tabs/NetworkController'));
  homeControllers.controller('ParametersController', require('./controllers/init/create/ParametersController'));
  homeControllers.controller('RootBlockController', require('./controllers/init/create/RootBlockController'));
  homeControllers.controller('SyncController', require('./controllers/init/sync/SyncController'));
  homeControllers.controller('SettingsController', require('./controllers/main/settings/SettingsController'));
  homeControllers.controller('DataController', require('./controllers/main/settings/tabs/DataController'));
  homeControllers.controller('CurrencyController', require('./controllers/main/settings/tabs/CurrencyController'));
  homeControllers.controller('KeyController', require('./controllers/main/settings/tabs/KeyController'));
  homeControllers.controller('GraphsController', require('./controllers/main/graphs/GraphsController'));
  homeControllers.controller('BlockchainGraphsController', require('./controllers/main/graphs/BlockchainGraphsController'));
};
