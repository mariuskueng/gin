var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var fs = require('fs');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;
var settings = null;
var settingsFile = __dirname + '/public/assets/settings.json';

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // read settings for window size
  fs.readFile(settingsFile, 'utf8', function(err, data) {
    if (err) throw err;
    settings = JSON.parse(data);

    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: settings.width ? settings.width : 800,
      height: settings.height ? settings.height : 600,
      'min-width': 460
    });

    // and load the index.html of the app.
    mainWindow.loadUrl('file://' + __dirname + '/index.html');

    // Open the devtools.
    // mainWindow.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      mainWindow = null;
    });

    mainWindow.on('resize', function() {
      var windowSize = mainWindow.getSize();
      settings.width = windowSize[0];
      settings.height = windowSize[1];

      // save current window size to settings
      fs.writeFile(settingsFile, JSON.stringify(settings), 'utf8', function() {
        // do something
      });
    });
  });
});
