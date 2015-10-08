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

    // save windows size to settings
    setWindowSize();

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

function setWindowSize() {
  var currentWindowSize = BrowserWindow.getFocusedWindow().getSize();
  var settings = readSettings();
  settings.width = currentWindowSize[0];
  settings.height = currentWindowSize[1];
  writeSettings(settings);
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


ipc.on('load-settings', function(settings) {
  if (settings.isPreviewVisible) {
    // resaving setting is not necessary
    togglePreview(true);
  }
  if (settings.isStatusbarVisible) {
    toggleStatusBar(true);
  }
});
