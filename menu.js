const app = require('app');
const BrowserWindow = require('browser-window');
const dialog = require('dialog');
const appName = app.getName();
const Menu = require('menu');

function sendAction(action) {
	const win = BrowserWindow.getFocusedWindow();
	win.restore();
	win.webContents.send(action);
}

const template = [
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
        click() {
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
        click() {
          newFile();
        }
      },
      {
        label: 'Open File...',
        accelerator: 'Cmd+O',
        click() {
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
        click() {
          sendAction('write-file');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Print...',
        accelerator: 'Cmd+P',
        click() {
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
        click() {
          sendAction('format-link');
        }
      },
      {
        label: 'Bold',
        accelerator: 'Cmd+B',
        click() {
          sendAction('format-bold');
        }
      },
      {
        label: 'Italic',
        accelerator: 'Cmd+I',
        click() {
          sendAction('format-italic');
        }
      },
      {
        label: 'Underline',
        accelerator: 'Cmd+U',
        click() {
          sendAction('format-underline');
        }
      },
      {
        label: 'Strikethrough',
        accelerator: 'Cmd+Shift+T',
        click() {
          sendAction('format-strikethrough');
        }
      },
      {
        label: 'Inline Code',
        click() {
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
        click() {
          sendAction('toggle-statusbar');
        }
      },
      {
        label: 'Toggle Preview',
        accelerator: 'Alt+Cmd+P',
        click() {
          sendAction('toggle-preview');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click() {
          BrowserWindow.getFocusedWindow().reload();
        }
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click() {
          BrowserWindow.getFocusedWindow().toggleDevTools();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Toggle Fullscreen',
        accelerator: 'Alt+Cmd+F',
        click() {
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

module.exports = Menu.buildFromTemplate(template);
