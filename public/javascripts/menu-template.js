var BrowserWindow = require('browser-window');
var dialog = require('dialog');

exports.getTemplate = function() {
  return [{
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
              ipc.send('new-file', file[0]);
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
  }];
};
