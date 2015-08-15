var remote = require('remote');
var app = remote.require('app');
var ipc = require('ipc');
var BrowserWindow = remote.require('browser-window');
var Menu = remote.require('menu');
var dialog = remote.require('dialog');
var shell = remote.require('shell');
var fs = require('fs');
var showdown  = require('showdown');
var clipboard = require('clipboard');

var win, editor, preview, previewVisible, statusbarVisible, converter, cm, menu, file, text, settings;

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

          ipc.send('new-file');
        }
      },
      {
        label: 'Open File...',
        accelerator: 'Cmd+O',
        click: function() {
          var properties = ['multiSelections', 'createDirectory', 'openFile'];
          var parentWindow = (process.platform == 'darwin') ? null : win;

          dialog.showOpenDialog(parentWindow, properties, function(f) {
            console.log("got a file: " + f);
            if (f) {
              readFile(f[0]);
            }
          });
        }
      },
      {
        label: 'Save File...',
        accelerator: 'Cmd+S',
        click: function() {
          writeFile();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Print...',
        accelerator: 'Cmd+P',
        click: function() {
          togglePreview();
          win.print();
          togglePreview();
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
          var clipboardText = clipboard.readText();
          var pastedLines = clipboardText.split('\n').length;
          var pastedChars = clipboardText.length;

          cm.replaceSelection(clipboardText, 'copy');
          cm.setCursor(cm.getCursor().line + pastedLines, cm.getCursor().ch + pastedChars);
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
      },
      {
        label: 'Strikethrough',
        accelerator: 'Cmd+Shift+T',
        click: function() {
          var text = cm.getSelection();
          if (text === '') {
            cm.replaceSelection("~~~~");
            var cursor = cm.getCursor();
            cm.setCursor({line: cursor.line, ch: cursor.ch - 2 });
          } else {
            text = "~~" + cm.getSelection() + "~~";
            cm.replaceSelection(text);
          }
        }
      },
      {
        label: 'Inline Code',
        click: function() {
          var text = cm.getSelection();
          if (text === '') {
            cm.replaceSelection("``");
            var cursor = cm.getCursor();
            cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
          } else {
            text = "`" + cm.getSelection() + "`";
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
  }
];

menu = Menu.buildFromTemplate(menuTemplate);

Menu.setApplicationMenu(menu);

onload = function() {
  win = BrowserWindow.getFocusedWindow();
  editor = document.getElementById("editor");
  preview = document.getElementById("preview");

  file = {
    name: '',
    path: '',
    text: '',
    unsaved: true,
    changed: false
  };

  previewVisible = false;
  statusbarVisible = false;

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
    if (statusbarVisible) renderStatusBarValues();
  });

  app.on('open-file', function(event, path) {
    readFile(path);
  });

  readSettings(__dirname + '/public/assets/settings.json');
};

function readFile(newFile) {
  if (newFile) {
    fs.readFile(newFile, 'utf8', function(err, data) {
      if (err) throw err;
      file.path = newFile;
      file.text = data;
      cm.setValue(file.text);
      setWindowTitle(file.path);
      // Add file to recent docs in osx dock
      app.addRecentDocument(file.path);
      console.log('Read a file.');
    });
  } else {
    console.error('No file given');
  }
}

function writeFile(callback) {
  if (file.path) {
    file.text = cm.getValue();
    fs.writeFile(file.path, file.text, 'utf8', function() {
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

      file.path = fileName;
      writeFile(function (err){
        if (err === undefined) {
          setWindowTitle(file.path);
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
    file.name = title;
  }
  win.setTitle(file.name);
}

function togglePreview() {
  previewVisible = previewVisible === false ? true : false;
  document.body.classList.toggle('preview-visible');
  renderMarkdown();
}

function toggleStatusBar() {
  statusbarVisible = statusbarVisible === false ? true : false;
  document.body.classList.toggle('statusbar-visible');
  renderStatusBarValues();
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

function getStatusBarText(value, text) {
  var statusBarText = value + ' ' + text;
  if (value > 1 || value < 1) statusBarText += 's';
  return statusBarText;
}

function countWords() {
  var statusWords = document.querySelector('.status-words');
  var wordsCount = 0;

  if (cm.getValue()) wordsCount = cm.getValue().split(' ').length;

  statusWords.innerHTML = getStatusBarText(wordsCount, 'word');

  return wordsCount;
}

function countCharacters() {
  var statusChars = document.querySelector('.status-chars');
  var charsCount = 0;

  if (cm.getValue()) charsCount = cm.getValue().length;

  statusChars.innerHTML = getStatusBarText(charsCount, 'character');

  return charsCount;
}

function setReadingDuration(wordsCount) {
  var statusReading = document.querySelector('.status-duration');
  var timeUnit = 'second';
  var wpm = 250; // words per minute
  var time = wordsCount / wpm;

  if (wordsCount >= wpm) {
    // minutes
    timeUnit = 'minute';
  } else {
    // seconds
    time = time * 60;
  }

  time = Math.round(time * 10) / 10;

  statusReading.innerHTML = getStatusBarText(time, timeUnit);

  return time;
}

function renderStatusBarValues() {
  var wordsCount = countWords();
  countCharacters();
  setReadingDuration(wordsCount);
}

function readSettings(settingsFile) {
  fs.readFile(settingsFile, 'utf8', function(err, data) {
    if (data === undefined) {
      settings = {};
    } else {
      settings = JSON.parse(data);
    }
  });
}
