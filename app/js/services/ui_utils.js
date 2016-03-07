module.exports = (app) => {

  app.factory('UIUtils', function($q, $translate) {
      return {

        toast: (msg) => {
          return $q.when($translate(msg)).then((translated) => Materialize.toast(translated, 4000))
        },

        enableInputs: () => $('i.prefix, label').addClass('active')
      }
    });
};
