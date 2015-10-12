var fs = require('fs');

var settingsFile = __dirname + '/public/assets/settings.json';

module.exports = {
  readSettings: function() {
    var settings = {};
    try {
      var data = fs.readFileSync(settingsFile, 'utf8');
      if (data !== undefined) {
        settings = JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    return settings;
  },

  writeSettings: function(settings) {
    try {
      fs.writeFile(settingsFile, JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }
  }
};
