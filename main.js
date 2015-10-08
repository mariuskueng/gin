var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var dialog = require('dialog');
var path = require('path');
var ipc = require('ipc');
var fs = require('fs');
var Menu = require('menu');
var menuTemplate = require('./public/javascripts/menu-template.js');

// Report crashes to our server.
require('crash-reporter').start();

var windowSize = {};
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
  // create new file
  newFile();
});

app.on('open-file', function(event, path) {
  setTimeout(function () {
    newFile(path);
  }, 500);
});

app.on('activate-with-no-open-windows', function(event) {
  newFile();
});

function newFile(passedFile) {
  // Read settings
  var settings = readSettings();

  // set saved window size
  windowSize.width = settings.width;
  windowSize.height = settings.height;

  // Create the browser window.
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is GCed.
  var w = new BrowserWindow({
    show: false,
    width: settings.width ? settings.width : 800,
    height: settings.height ? settings.height : 600,
    'min-width': 400,
    'min-height': 200
  });

  var template = menuTemplate.getTemplate();
  var menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // and load the index.html of the app.
  var indexPath = 'file://' + __dirname + '/index.html';
  w.loadUrl(indexPath);

  w.webContents.on("did-finish-load", function() {
    w.webContents.send('load-settings', settings);

    if (passedFile) {
      w.webContents.send('read-file', passedFile);
    }

    w.show();
  });

  // Open the devtools.
  // w.openDevTools();

  w.on('close', function(e) {
    // save current window size to settings
    var settings = readSettings();
    writeSettings(settings);
  });

  // Emitted when the window is closed.
  w.on('closed', function(e) {
    e.preventDefault();
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    w = null;
  });
}

function readSettings() {
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
}

function writeSettings(settings) {
  if (windowSize) {
    settings.width = windowSize.width;
    settings.height = windowSize.height;
  }

  try {
    fs.writeFile(settingsFile, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}
