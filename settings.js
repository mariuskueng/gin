'use strict';

const fs = require('fs');

const settingsFile =
  process.env.HOME + '/Library/Application\ Support/gin/settings.json';

module.exports = {
  readSettings: () => {
    let settings = {};
    try {
      let data = fs.readFileSync(settingsFile, 'utf8');
      if (data !== undefined) {
        settings = JSON.parse(data);
      }
    }
    catch (e) {
      console.error(e);
    }
    return settings;
  },

  writeSettings: (settings) => {
    try {
      fs.writeFile(settingsFile, JSON.stringify(settings));
    }
    catch (e) {
      console.error(e);
    }
  }
};
