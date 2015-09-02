var remote = require('remote');
var app = remote.require('app');
var ipc = require('ipc');
var BrowserWindow = remote.require('browser-window');
var dialog = remote.require('dialog');
var shell = remote.require('shell');
var fs = require('fs');
var showdown  = require('showdown');
var clipboard = require('clipboard');
var path = require('path');

var win,
    editor,
    preview,
    previewVisible,
    statusbarVisible,
    converter,
    cm,
    menu,
    file,
    text,
    settingsFile;

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
      styleSelectedText: true,
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

  window.onbeforeunload = function(e) {
    // Unlike usual browsers, in which a string should be returned and the user is
    // prompted to confirm the page unload, Electron gives developers more options.
    // Returning empty string or false would prevent the unloading now.
    // You can also use the dialog API to let the user confirm closing the application.
    e.returnValue = false;

    if ((cm.getValue() === "") || (cm.getValue() === file.text)) {
      e.returnValue = true;
    } else {
      // save file and close window
      if (file.path) {
          writeFile();
          e.returnValue = true;
      } else {

        var buttons = [
          "Save As",
          "Cancel",
          "Don't save"
        ];

        dialog.showMessageBox({
          type: "question",
          buttons: buttons,
          title: 'Do you want to save the changes made to the document "Untitled"?',
          message: "Your changes will be lost if you don't save them."
        }, function(response) {
          console.log(response);
          if (response === 0) {
            // Save as
            // Prompt save dialog
            createFile(function(e) {
              BrowserWindow.getFocusedWindow().destroy();
            });
          } else if (response === 2) {
            // Don't save
            BrowserWindow.getFocusedWindow().destroy();
          } else {
            // Cancel, do nothing
          }
        });
      }
    }
  };

  settingsFile = __dirname + '/public/assets/settings.json';
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

ipc.on('read-file', function(file) {
  readFile(file);
});

function writeFile(callback) {
  if (file.path) {
    file.text = cm.getValue();
    fs.writeFile(file.path, file.text, 'utf8', function() {
      console.log('Wrote a file.');
      if (callback) callback();
    });
  } else {
    console.log('no file specified. create new file.');
    createFile(callback);
  }
}

ipc.on('write-file', function() {
  writeFile();
});

function createFile(callback) {
  dialog.showSaveDialog({ filters: [
     { name: 'Markdown', extensions: ['md', 'markdown'] }
    ]}, function (fileName) {
      if (fileName === undefined) {
        // if dialog gets closed without saving run callback and return
        if (callback) callback();
        return;
      }

      file.path = fileName;
      writeFile(function (err){
        if (err === undefined) {
          setWindowTitle(file.path);
        } else {
          dialog.showErrorBox("File Save Error", err.message);
        }
      });
      if (callback) callback();
    }
  );
}

function setWindowTitle(title) {
  if (title.indexOf('/') > -1) {
    var titleParts = title.split('/');
    title = titleParts[titleParts.length - 1];
    file.name = title;
  }
  BrowserWindow.getFocusedWindow().setTitle(file.name);
}

function togglePreview(dontSaveSettings) {
  previewVisible = previewVisible === false ? true : false;
  document.body.classList.toggle('preview-visible');
  renderMarkdown();

  // update preview setting
  if (!dontSaveSettings) {
    var settings = readSettings(settingsFile);
    settings.isPreviewVisible = previewVisible;
    writeSettings(settings);
  }
}

ipc.on('toggle-preview', function() {
  togglePreview();
});

function toggleStatusBar(dontSaveSettings) {
  statusbarVisible = statusbarVisible === false ? true : false;
  document.body.classList.toggle('statusbar-visible');
  renderStatusBarValues();

  // update statusbar setting
  if (!dontSaveSettings) {
    var settings = readSettings(settingsFile);
    settings.isStatusbarVisible = statusbarVisible;
    writeSettings(settings);
  }
}

ipc.on('toggle-statusbar', function() {
  toggleStatusBar();
});

function renderMarkdown() {
  preview.innerHTML = converter.makeHtml(cm.getValue());

  var links = document.querySelectorAll('#preview a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', clickLinkEvent);
  }

  var images = document.querySelectorAll('#preview img');
  for (var j = 0; j < images.length; j++) {
    var imagePath = images[j].getAttribute('src');
    if (imagePath.indexOf('http') > -1)
      images[j].setAttribute('src', imagePath);
    else
      images[j].setAttribute('src', path.resolve(file.path, '..', imagePath));
  }
}

ipc.on('render-markdown', function() {
  renderMarkdown();
});

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

function readSettings(callback) {
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
  try {
    fs.writeFile(settingsFile, JSON.stringify(settings));
  } catch (e) {
    console.error(e);
  }
}

ipc.on('write-settings', function(settings) {
  writeSettings(settings);
});

ipc.on('format-bold', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection("****");
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 2 });
  } else {
    text = "**" + cm.getSelection() + "**";
    cm.replaceSelection(text);
  }
});

ipc.on('format-link', function() {
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
});

ipc.on('format-italic', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection("**");
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
  } else {
    text = "*" + cm.getSelection() + "*";
    cm.replaceSelection(text);
  }
});

ipc.on('format-underline', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection("__");
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
  } else {
    text = "_" + cm.getSelection() + "_";
    cm.replaceSelection(text);
  }
});

ipc.on('format-strikethrough', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection("~~~~");
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 2 });
  } else {
    text = "~~" + cm.getSelection() + "~~";
    cm.replaceSelection(text);
  }
});

ipc.on('format-inline-code', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection("``");
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
  } else {
    text = "`" + cm.getSelection() + "`";
    cm.replaceSelection(text);
  }
});

ipc.on('load-settings', function(settings) {
  if (settings.isPreviewVisible) {
    // resaving setting is not necessary
    togglePreview(true);
  }
  if (settings.isStatusbarVisible) {
    toggleStatusBar(true);
  }
});
