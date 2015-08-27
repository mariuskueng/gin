var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var dialog = require('dialog');
var path = require('path');
var ipc = require('ipc');
var fs = require('fs');
var Menu = require('menu');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
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
    if (data === undefined) {
      settings = {};
    } else {
      settings = JSON.parse(data);
    }

    // create new file
    newFile();
  });
});

function newFile() {
  // Create the browser window.
  var w = new BrowserWindow({
    width: settings.width ? settings.width : 800,
    height: settings.height ? settings.height : 600,
    'min-width': 460
  });

  var indexPath = 'file://' + __dirname + '/index.html';

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
            var window = BrowserWindow.getFocusedWindow();

            dialog.showOpenDialog(window, {
              properties: properties,
              filters: [
                  { name: 'text', extensions: ['md', 'markdown'] }
              ]
            }, function(file) {
              console.log("got a file: " + file);
              if (file === undefined) {
                  return;
              } else{
                  window.webContents.send('read-file', file[0]);
              }
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
            toggleStatusBar();
          }
        },
        {
          label: 'Toggle Preview',
          accelerator: 'Alt+Cmd+P',
          click: function() {
            togglePreview();
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
  w.loadUrl(indexPath);

  // Open the devtools.
  // w.openDevTools();

  // Emitted when the window is closed.
  w.on('closed', function(e) {
    e.preventDefault();
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    w = null;

    // save current window size to settings
    fs.writeFile(settingsFile, JSON.stringify(settings), 'utf8', function() {
      // do something
    });
  });

  w.on('resize', function() {
    var windowSize = BrowserWindow.getFocusedWindow().getSize();
    settings.width = windowSize[0];
    settings.height = windowSize[1];
  });
}
