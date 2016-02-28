var ipc = require('electron').ipcRenderer;

// Format menu key-bindings

ipc.on('format-bold', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection('****');
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 2 });
  }
  else {
    text = '**' + cm.getSelection() + '**';
    cm.replaceSelection(text);
  }
});

ipc.on('format-link', function() {
  var text = cm.getSelection();
  var cursor;
  if (text === '') {
    cm.replaceSelection('[]()');
    cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 3 });
  }
  else {
    text = '[' + cm.getSelection() + ']()';
    cm.replaceSelection(text);
    cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
  }
});

ipc.on('format-italic', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection('**');
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
  }
  else {
    text = '*' + cm.getSelection() + '*';
    cm.replaceSelection(text);
  }
});

ipc.on('format-underline', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection('__');
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
  }
  else {
    text = '_' + cm.getSelection() + '_';
    cm.replaceSelection(text);
  }
});

ipc.on('format-strikethrough', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection('~~~~');
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 2 });
  }
  else {
    text = '~~' + cm.getSelection() + '~~';
    cm.replaceSelection(text);
  }
});

ipc.on('format-inline-code', function() {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection('``');
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch - 1 });
  }
  else {
    text = '`' + cm.getSelection() + '`';
    cm.replaceSelection(text);
  }
});

var formatHeading = function(heading) {
  var text = cm.getSelection();
  if (text === '') {
    cm.replaceSelection(heading);
    var cursor = cm.getCursor();
    cm.setCursor({line: cursor.line, ch: cursor.ch });
  }
  else {
    text = heading + cm.getSelection();
    cm.replaceSelection(text);
  }
}

ipc.on('format-h1', function() {
  formatHeading('# ');
});

ipc.on('format-h2', function() {
  formatHeading('## ');
});

ipc.on('format-h3', function() {
  formatHeading('### ');
});

ipc.on('format-h4', function() {
  formatHeading('#### ');
});

ipc.on('format-h5', function() {
  formatHeading('##### ');
});

ipc.on('format-h6', function() {
  formatHeading('###### ');
});
