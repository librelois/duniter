var _ = require('underscore');
var conf = require('../lib/conf/conf');
let moment = require('moment');

module.exports = (app) => {

    app.filter('mt_date', () => {
      return (input) => {
        if(input == null){ return ""; }
        return moment(input * 1000).format('YYYY MM DD');
      };
    });

    app.filter('mt_time', () => {
      return (input) => {
        if(input == null){ return ""; }
        return moment(input * 1000).format('HH:mm:ss');
      };
    });
};
