var remote = require('remote');
var app = remote.require('app');
var BrowserWindow = remote.require('browser-window');
var Menu = remote.require('menu');
var dialog = remote.require('dialog');
var shell = remote.require('shell');
var fs = require('fs');
var showdown  = require('showdown');
var clipboard = require('clipboard');

var editor, preview, previewVisible, converter, cm, menu, file, text;

var menuTemplate = [
  {
    label: 'Gin',
    submenu: [
      {
        label: 'About Gin',
        click: function() {
          shell.openExternal('https://github.com/mariuskueng/gin');
        }
      },
      {
        label: 'Preferences...',
        accelerator: 'Cmd+,',
      },
      {
        label: 'Quit',
        accelerator: 'Cmd+Q',
        click: function() { app.quit(); }
      }
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
          console.warn('Careful, same instance');
          window.open('file://' + __dirname + '/index.html');
        }
      },
      {
        label: 'Open File',
        accelerator: 'Cmd+O',
        click: function() {
          var properties = ['multiSelections', 'createDirectory', 'openFile'];
          var parentWindow = (process.platform == 'darwin') ? null : BrowserWindow.getFocusedWindow();

          dialog.showOpenDialog(parentWindow, properties, function(f) {
            console.log("got a file: " + f);
            if (f) {
              readFile(f[0]);
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
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Undo',
        accelerator: 'Cmd+Z',
        click: function() {
          cm.execCommand("undo");
        }
      },
      {
        label: 'Redo',
        accelerator: 'Shift+Cmd+Z',
        click: function() {
          cm.execCommand("redo");
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Cut',
        accelerator: 'Cmd+X',
        click: function() {
          clipboard.writeText(cm.getSelection(), 'copy');
          cm.replaceSelection('');
        }
      },
      {
        label: 'Copy',
        accelerator: 'Cmd+C',
        click: function() {
          clipboard.writeText(cm.getSelection(), 'copy');
        }
      },
      {
        label: 'Paste',
        accelerator: 'Cmd+V',
        click: function() {
          cm.replaceSelection(clipboard.readText(), 'copy');
        }
      },
      {
        label: 'Select All',
        accelerator: 'Cmd+A',
        click: function() {
          cm.execCommand("selectAll");
        }
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
          var text = cm.getSelection();
          var cursor;
          if (text === '') {
            cm.replaceSelection("[]()");
            cursor = cm.getCursor();
            cm.setCursor({line: cursor.line, ch: cursor.ch - 3 });
          } else {
            text = "[" + cm.getSelection() + "]()";
            cm.replaceSelection(text);
            cursor = cm.getCursor();
            cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
          }
        }
      },
      {
        label: 'Bold',
        accelerator: 'Cmd+B',
        click: function() {
          var text = cm.getSelection();
          if (text === '') {
            cm.replaceSelection("****");
            var cursor = cm.getCursor();
            cm.setCursor({line: cursor.line, ch: cursor.ch - 2 });
          } else {
            text = "**" + cm.getSelection() + "**";
            cm.replaceSelection(text);
          }
        }
      },
      {
        label: 'Italic',
        accelerator: 'Cmd+I',
        click: function() {
          var text = cm.getSelection();
          if (text === '') {
            cm.replaceSelection("**");
            var cursor = cm.getCursor();
            cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
          } else {
            text = "*" + cm.getSelection() + "*";
            cm.replaceSelection(text);
          }
        }
      },
      {
        label: 'Underline',
        accelerator: 'Cmd+U',
        click: function() {
          var text = cm.getSelection();
          if (text === '') {
            cm.replaceSelection("__");
            var cursor = cm.getCursor();
            cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
          } else {
            text = "_" + cm.getSelection() + "_";
            cm.replaceSelection(text);
          }
        }
      }
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

  previewVisible = false;

  // showdown constructor
  converter = new showdown.Converter({
    strikethrough: true,
    tables: true,
    ghCodeBlocks: true,
    tasklists: true,
    smoothLivePreview: true
  });

  // CodeMirror constructor
  cm = CodeMirror(
    editor,
    {
      mode: {
        name: 'gfm',
        highlightFormatting: true
      },
      lineWrapping: true,
      tabSize: 4,
      indentUnit: 4,
      viewportMargin: Infinity,
      autofocus: true,
      theme: "gin",
      extraKeys: { // addons
        "Enter": "newlineAndIndentContinueMarkdownList"
      },
      autoCloseBrackets: true
    }
  );

  // re-render Markdown on every CodeMirror change event
  cm.on("change", function(e) {
    if (previewVisible) renderMarkdown();
  });

  app.on('open-file', function(event, path) {
    readFile(path);
  });

};

function readFile(newFile) {
  if (newFile) {
    fs.readFile(newFile, 'utf8', function(err, data) {
      if (err) throw err;
      file = newFile;
      text = data;
      cm.setValue(text);
      setWindowTitle(file);
      // Add file to recent docs in osx dock
      app.addRecentDocument(file);
      console.log('Read a file.');
    });
  } else {
    console.error('No file given');
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
  previewVisible = previewVisible === false ? true : false;
  document.body.classList.toggle('preview-visible');
  renderMarkdown();
}

function renderMarkdown() {
  preview.innerHTML = converter.makeHtml(cm.getValue());

  var links = document.querySelectorAll('#preview a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', clickLinkEvent);
  }
}

function clickLinkEvent(e) {
  e.preventDefault();
  shell.openExternal(e.srcElement.href);
}
