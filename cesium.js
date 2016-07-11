const
  request = require('request'),
  fs = require('fs'),
  unzip = require('unzip');

const CESIUM_RELEASE = '0.1.26';

return request({
  followAllRedirects: true,
  url: 'https://github.com/duniter/cesium/releases/download/' + CESIUM_RELEASE + '/cesium-web-' + CESIUM_RELEASE + '.zip'
}).pipe(unzip.Extract({ path: './cesium' }));
