var remote = require('remote');
var app = remote.require('app');
var ipc = require('ipc');
var BrowserWindow = remote.require('browser-window');
var dialog = remote.require('dialog');
var shell = remote.require('shell');
var showdown  = require('showdown');
var clipboard = require('clipboard');
var path = require('path');
var settings = require('./settings');

var win,
    editor,
    preview,
    previewVisible,
    converter,
    cm,
    menu,
    text,
    settingsFile = __dirname + '/public/assets/settings.json';

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

    if ((cm.getValue() === "") || (cm.getValue() === File.text)) {
      e.returnValue = true;
    } else {
      // save file and close window
      if (File.path) {
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
};

function setWindowTitle(title) {
  if (title.indexOf('/') > -1) {
    var titleParts = title.split('/');
    title = titleParts[titleParts.length - 1];
    File.name = title;
  }
  BrowserWindow.getFocusedWindow().setTitle(File.name);
}

function togglePreview(dontSaveSettings) {
  previewVisible = previewVisible === false ? true : false;
  document.body.classList.toggle('preview-visible');
  renderMarkdown();

  // update preview setting
  if (!dontSaveSettings) {
    var editorSettings = settings.readSettings();
    editorSettings.isPreviewVisible = previewVisible;
    settings.writeSettings(editorSettings);
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
    var editorSettings = settings.readSettings(settingsFile);
    editorSettings.isStatusbarVisible = statusbarVisible;
    settings.writeSettings(editorSettings);
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
      images[j].setAttribute('src', path.resolve(File.path, '..', imagePath));
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
  var win = BrowserWindow.getFocusedWindow();
  if (win) {
    var currentWindowSize = win.getSize();
    var editorSettings = settings.readSettings();
    editorSettings.width = currentWindowSize[0];
    editorSettings.height = currentWindowSize[1];
    settings.writeSettings(editorSettings);
  }
}

ipc.on('write-settings', function(editorSettings) {
  settings.writeSettings(editorSettings);
});


ipc.on('load-settings', function(editorSettings) {
  if (editorSettings.isPreviewVisible) {
    // resaving setting is not necessary
    togglePreview(true);
  }
  if (editorSettings.isStatusbarVisible) {
    toggleStatusBar(true);
  }
});
