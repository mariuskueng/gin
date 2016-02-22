'use strict';

// imports
const app = require('app');  // Module to control application life.
const BrowserWindow = require('browser-window');
const ipc = require('electron').ipcMain;
const Menu = require('menu');
const dialog = require('dialog');
const shell = require('shell');
const settings = require('./settings');

// globals
let file;
let menuTemplate;
let allWindowsClosed;

function sendAction (action, value, sendToAllWindows) {
  if (sendToAllWindows) {
    let windows = BrowserWindow.getAllWindows();
    for (let w of windows) {
      w.webContents.send(action, value);
    }
  }
  else {
    let win = BrowserWindow.getFocusedWindow();
    win.webContents.send(action, value);
  }
}

function newFile (filePath) {
  allWindowsClosed = false;
  // Read settings
  let editorSettings = settings.readSettings();
  let windowSize = {
    width: editorSettings.width,
    height: editorSettings.height
  };

  let menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // define path of index.html
  let indexPath = 'file://' + __dirname + '/index.html';

  // Create the browser window.
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is GCed.
  let win = new BrowserWindow({
    show: false,
    width: editorSettings.width ? editorSettings.width : 800,
    height: editorSettings.height ? editorSettings.height : 600,
    minWidth: 400,
    minHeight: 200
  });

  // and load the index.html of the app.
  win.loadURL(indexPath);

  // load the settings after window has been loaded
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('load-settings', editorSettings);

    if (editorSettings.theme) {
      win.webContents.send('set-theme', editorSettings.theme);
    }

    if (filePath) {
      win.webContents.send('read-file', filePath);
    }

    // show the window
    win.show();
  });

  // Open the devtools.
  // w.openDevTools();

  win.on('close', (e) => {
    // save current window size to settings
    editorSettings = settings.readSettings();
    if (windowSize) {
      editorSettings.width = windowSize.width;
      editorSettings.height = windowSize.height;
    }
    settings.writeSettings(editorSettings);
  });

  // Emitted when the window is closed.
  win.on('closed', (e) => {
    e.preventDefault();
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// app events

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  allWindowsClosed = true;
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-finish-launching', () => {
  app.on('open-file', (event, path) => {
    // if app is running open a new window
    if (BrowserWindow.getFocusedWindow() || allWindowsClosed) {
      newFile(path);
    }
    // if app is not running set file for ready event
    else {
      file = path;
    }
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  // create new window with file
  newFile(file);
});

app.on('activate', (event) => {
  if (!BrowserWindow.getFocusedWindow()) {
    newFile();
  }
});

menuTemplate = [
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
      // {
      //   label: 'Preferences...',
      //   accelerator: 'Cmd+,'
      // },
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
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'New File',
        accelerator: 'Cmd+N',
        click: () => {
          newFile();
        }
      },
      {
        label: 'Open File...',
        accelerator: 'Cmd+O',
        click: () => {
          let properties = ['createDirectory', 'openFile'];
          dialog.showOpenDialog({
            properties: properties,
            filters: [
              { name: 'text', extensions: ['md', 'markdown'] }
            ]
          }, (path) => {
            if (path) {
              newFile(path[0]);
              console.log('got a file: ' + path);
            }
          });
        }
      },
      {
        label: 'Save File...',
        accelerator: 'Cmd+S',
        click: () => {
          sendAction('write-file');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Print...',
        accelerator: 'Cmd+P',
        click: () => {
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
        click: () => {
          sendAction('format-link');
        }
      },
      {
        label: 'Bold',
        accelerator: 'Cmd+B',
        click: () => {
          sendAction('format-bold');
        }
      },
      {
        label: 'Italic',
        accelerator: 'Cmd+I',
        click: () => {
          sendAction('format-italic');
        }
      },
      {
        label: 'Underline',
        accelerator: 'Cmd+U',
        click: () => {
          sendAction('format-underline');
        }
      },
      {
        label: 'Strikethrough',
        accelerator: 'Cmd+Shift+T',
        click: () => {
          sendAction('format-strikethrough');
        }
      },
      {
        label: 'Inline Code',
        click: () => {
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
        click: () => {
          sendAction('toggle-statusbar');
        }
      },
      {
        label: 'Toggle Preview',
        accelerator: 'Alt+Cmd+P',
        click: () => {
          sendAction('toggle-preview');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: () => {
          BrowserWindow.getFocusedWindow().reload();
        }
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: () => {
          BrowserWindow.getFocusedWindow().toggleDevTools();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Toggle Fullscreen',
        accelerator: 'Alt+Cmd+F',
        click: () => {
          if (BrowserWindow.getFocusedWindow().isFullScreen()) {
            BrowserWindow.getFocusedWindow().setFullScreen(false);
          }
          else {
            BrowserWindow.getFocusedWindow().setFullScreen(true);
          }
        }
      }
    ]
  },
  {
    label: 'Themes',
    submenu: [
      {
        label: 'Gin Light',
        click: () => {
          sendAction('toggle-theme', 'gin', true);
        }
      },
      {
        label: 'Gin Dark',
        click: () => {
          sendAction('toggle-theme', 'gin-dark', true);
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
        click: () => {
          shell.openExternal('https://github.com/mariuskueng/gin');
        }
      }
   ]
  }
];
