var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var Menu = require('menu');
var dialog = require('dialog');
var shell = require('shell');
var settings = require('./settings');

// Report crashes to our server.
require('crash-reporter').start();

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


function newFile (passedFile) {
  // Read settings
  var editorSettings = settings.readSettings();

  var windowSize = {};

  // set saved window size
  windowSize.width = editorSettings.width;
  windowSize.height = editorSettings.height;

  // Create the browser window.
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is GCed.
  var w = new BrowserWindow({
    show: false,
    width: editorSettings.width ? editorSettings.width : 800,
    height: editorSettings.height ? editorSettings.height : 600,
    'min-width': 400,
    'min-height': 200
  });

  function sendAction(action, value) {
  	w.webContents.send(action, value);
  }

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
          label: 'Hide Gin',
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
          click: function() {
            app.quit();
          }
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
            newFile();
          }
        },
        {
          label: 'Open File...',
          accelerator: 'Cmd+O',
          click: function() {
            var properties = ['createDirectory', 'openFile'];
            var win = BrowserWindow.getFocusedWindow();

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
            sendAction('write-file');
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Print...',
          accelerator: 'Cmd+P',
          click: function() {
            sendAction('render-markdown');
            BrowserWindow.getFocusedWindow().print();
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
            sendAction('format-link');
          }
        },
        {
          label: 'Bold',
          accelerator: 'Cmd+B',
          click: function() {
            sendAction('format-bold');
          }
        },
        {
          label: 'Italic',
          accelerator: 'Cmd+I',
          click: function() {
            sendAction('format-italic');
          }
        },
        {
          label: 'Underline',
          accelerator: 'Cmd+U',
          click: function() {
            sendAction('format-underline');
          }
        },
        {
          label: 'Strikethrough',
          accelerator: 'Cmd+Shift+T',
          click: function() {
            sendAction('format-strikethrough');
          }
        },
        {
          label: 'Inline Code',
          click: function() {
            sendAction('format-inline-code');
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
            sendAction('toggle-statusbar');
          }
        },
        {
          label: 'Toggle Preview',
          accelerator: 'Alt+Cmd+P',
          click: function() {
            sendAction('toggle-preview');
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
      label: 'Themes',
      submenu: [
        {
          label: 'Gin Light',
          click: function() {
            sendAction('toggle-theme', 'gin');
          }
        },
        {
          label: 'Gin Dark',
          click: function() {
            sendAction('toggle-theme', 'gin-dark');
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
      submenu: [
        {
    		label: 'Gin Website...',
    		click: function() {
    			shell.openExternal('https://github.com/mariuskueng/gin');
    		}
  	   }
     ]
    }
  ];

  var menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // and load the index.html of the app.
  var indexPath = 'file://' + __dirname + '/index.html';
  w.loadUrl(indexPath);

  w.webContents.on("did-finish-load", function() {
    w.webContents.send('load-settings', editorSettings);

    if (editorSettings.theme)
      w.webContents.send('set-theme', editorSettings.theme);

    if (passedFile) {
      w.webContents.send('read-file', passedFile);
    }

    w.show();
  });

  // Open the devtools.
  // w.openDevTools();

  w.on('close', function(e) {
    // save current window size to settings
    editorSettings = settings.readSettings();
    if (windowSize) {
      editorSettings.width = windowSize.width;
      editorSettings.height = windowSize.height;
    }
    settings.writeSettings(editorSettings);
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
