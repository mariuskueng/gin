var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var dialog = require('dialog');
var path = require('path');
var ipc = require('ipc');
var fs = require('fs');
var Menu = require('menu');

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
    if (BrowserWindow.getAllWindows().length === 0)
      newFile(path);
    else {
      var window = BrowserWindow.getFocusedWindow();
      window.webContents.send('read-file', path);
    }
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

  var menuTemplate = [
    {
      label: 'Gin',
      submenu: [
        {
          label: 'About Gin',
          selector: 'orderFrontStandardAboutPanel:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide Electron',
          accelerator: 'CmdOrCtrl+H',
          selector: 'hide:'
        },
        {
          label: 'Hide Others',
          accelerator: 'CmdOrCtrl+Shift+H',
          selector: 'hideOtherApplications:'
        },
        {
          label: 'Show All',
          selector: 'unhideAllApplications:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          selector: 'terminate:'
        },
      ]
    },
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'Cmd+N',
          click: function() {
            console.log('New file');
            newFile();
          }
        },
        {
          label: 'Open File...',
          accelerator: 'Cmd+O',
          click: function() {
            var properties = ['createDirectory', 'openFile'];

            dialog.showOpenDialog({
              properties: properties,
              filters: [
                  { name: 'text', extensions: ['md', 'markdown'] }
              ]
            }, function(file) {
              console.log("got a file: " + file);
              if (file === undefined)
                  return;
              else
                newFile(file[0]);
            });
          }
        },
        {
          label: 'Save File...',
          accelerator: 'Cmd+S',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('write-file');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Print...',
          accelerator: 'Cmd+P',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('render-markdown');
            window.print();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          selector: 'undo:'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          selector: 'redo:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          selector: 'cut:'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          selector: 'copy:'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          selector: 'paste:'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          selector: 'selectAll:'
        }
      ]
    },
    {
      label: 'Format',
      submenu: [
        {
          label: 'Link',
          accelerator: 'Cmd+K',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('format-link');
          }
        },
        {
          label: 'Bold',
          accelerator: 'Cmd+B',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('format-bold');
          }
        },
        {
          label: 'Italic',
          accelerator: 'Cmd+I',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('format-italic');
          }
        },
        {
          label: 'Underline',
          accelerator: 'Cmd+U',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('format-underline');
          }
        },
        {
          label: 'Strikethrough',
          accelerator: 'Cmd+Shift+T',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('format-strikethrough');
          }
        },
        {
          label: 'Inline Code',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('format-inline-code');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Status Bar',
          accelerator: 'Cmd+/',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('toggle-statusbar');
          }
        },
        {
          label: 'Toggle Preview',
          accelerator: 'Alt+Cmd+P',
          click: function() {
            var window = BrowserWindow.getFocusedWindow();
            window.webContents.send('toggle-preview');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: function() {
            BrowserWindow.getFocusedWindow().reload();
          }
        },
        {
          label: 'Toggle DevTools',
          accelerator: 'Alt+CmdOrCtrl+I',
          click: function() {
            BrowserWindow.getFocusedWindow().toggleDevTools();
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: 'Alt+Cmd+F',
          click: function() {
            if (BrowserWindow.getFocusedWindow().isFullScreen())
              BrowserWindow.getFocusedWindow().setFullScreen(false);
            else
              BrowserWindow.getFocusedWindow().setFullScreen(true);
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          selector: 'performMiniaturize:'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          selector: 'performClose:'
        },
        {
          type: 'separator'
        },
        {
          label: 'Bring All to Front',
          selector: 'arrangeInFront:'
        }
      ]
    },
    {
      label: 'Help',
      submenu: []
    }
  ];

  var menu = Menu.buildFromTemplate(menuTemplate);
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

  w.on('resize', function() {
    var currentWindowSize = BrowserWindow.getFocusedWindow().getSize();
    windowSize.width = currentWindowSize[0];
    windowSize.height = currentWindowSize[1];
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
