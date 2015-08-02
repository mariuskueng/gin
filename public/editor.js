var remote = require('remote');
var Menu = remote.require('menu');
var dialog = remote.require('dialog');
var fs = require('fs');

var editor, cm, menu, file, text;

var menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
          label: 'Open File',
          accelerator: 'Cmd+O',
          click: function() {
            var properties = ['multiSelections', 'createDirectory', 'openFile'];
            var parentWindow = (process.platform == 'darwin') ? null : BrowserWindow.getFocusedWindow();

            dialog.showOpenDialog(parentWindow, properties, function(f) {
              console.log("got a file: " + f);
              file = f[0];
              readFile();
            });
          }
      },
      {
        label: 'Save File',
        accelerator: 'Cmd+S',
        click: function() {
          writeFile();
        }
      },
      {
        label: 'Quit',
        accelerator: 'Cmd+Q',
        click: function() { app.quit(); }
      },
    ]
  }
];

menu = Menu.buildFromTemplate(menuTemplate);

Menu.setApplicationMenu(menu);

onload = function() {
  editor = document.getElementById("editor");

  cm = CodeMirror(
    editor,
    {
      mode: {
        name: 'gfm',
        highlightFormatting: true
      },
      lineWrapping: true,
      tabSize: 2,
      viewportMargin: Infinity,
      theme: "gin",
      value: "# This is some Markdown \nIt's **awesome**.",
      extraKeys: {
        "Cmd-S": function(instance) {
          // handleSaveButton();
        },
        "Ctrl-S": function(instance) {
          // handleSaveButton();
        },
      }
    }
  );
};

function readFile() {
  if (file) {
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) throw err;
      text = data;
      cm.setValue(text);
      console.log('Read a file.');
    });
  }
}

function writeFile() {
  if (file) {
    text = cm.getValue();
    fs.writeFile(file, cm.getValue(), 'utf8', function() {
      console.log('Wrote a file.');
    });
  }
}
