var remote = require('remote');
var app = remote.require('app');
var BrowserWindow = remote.require('browser-window');
var Menu = remote.require('menu');
var dialog = remote.require('dialog');
var fs = require('fs');
var showdown  = require('showdown');
var clipboard = require('clipboard');

var editor, preview, converter, cm, menu, file, text;

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
            if (f) {
              file = f[0];
              readFile();
            }
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
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Toggle Preview',
        accelerator: 'Alt+Cmd+P',
        click: function() {
          togglePreview();
        }
      }
    ]
  }
];

menu = Menu.buildFromTemplate(menuTemplate);

Menu.setApplicationMenu(menu);

onload = function() {
  editor = document.getElementById("editor");
  preview = document.getElementById("preview");

  converter = new showdown.Converter();

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
      // value: "# This is some Markdown \nIt's **awesome**.\n",
      extraKeys: {
        "Cmd-S": function(instance) {
          writeFile();
        },
        "Cmd-V": function(instance) {
          console.log('paste');
          instance.replaceSelection(clipboard.readText());

        },
        "Cmd-C": function(instance) {
          console.log('copy');
          clipboard.writeText(cm.getSelection());
        }
      }
    }
  );

  setWindowTitle('Untitled');

  // re-render Markdown on every CodeMirror change event
  cm.on("change", function(e) {
    renderMarkdown();
  });

};

function readFile() {
  if (file) {
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) throw err;
      text = data;
      cm.setValue(text);
      setWindowTitle(file);
      console.log('Read a file.');
    });
  }
}

function writeFile(callback) {
  if (file) {
    text = cm.getValue();
    fs.writeFile(file, cm.getValue(), 'utf8', function() {
      console.log('Wrote a file.');
    });
  } else {
    console.log('no file specified. create new file.');
    createFile();
  }
  if (callback) callback();
}

function createFile() {
  dialog.showSaveDialog({ filters: [
     { name: 'Markdown', extensions: ['md', 'markdown'] }
    ]}, function (fileName) {
      if (fileName === undefined) return;

      file = fileName;
      writeFile(function (err){
        if (err === undefined) {
          setWindowTitle(file);
        } else {
          dialog.showErrorBox("File Save Error", err.message);
        }
      });
  });
}

function setWindowTitle(title) {
  if (title.indexOf('/') > -1) {
    var titleParts = title.split('/');
    title = titleParts[titleParts.length - 1];
  }
  BrowserWindow.getFocusedWindow().setTitle(title);
}

function togglePreview() {
  document.body.classList.toggle('preview-visible');
  renderMarkdown();
}

function renderMarkdown() {
  preview.innerHTML = converter.makeHtml(cm.getValue());
}
