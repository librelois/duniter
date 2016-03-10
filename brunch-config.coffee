module.exports = config:

  files:
    javascripts:
      joinTo:
        'bowers.js': /bower_components[\\/]/
        'libraries.js': /(node_modules|vendor)[\\/]/
        'app.js': /app[\\/]/
      order:
        before: [/js\/controllers\//]
    stylesheets: joinTo: 'app.css'
    templates: joinTo: 'templates.js'

  plugins:
    fbFlo:
      resolverReload: true
    babel:
      presets: ['es2015','stage-0']

  overrides:
    production:
      sourceMaps: true

  server:
    hostname: '192.168.1.35'
