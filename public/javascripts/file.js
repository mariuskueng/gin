var remote = require('remote');
var ipc = require('ipc');
var BrowserWindow = remote.require('browser-window');
var dialog = remote.require('dialog');
var fs = require('fs');
var config = require('./settings');

var File = {
  path: '',
  text: '',
  unsaved: true,
  changed: false
};

// File operations

File.readFile = function(newFile) {
  if (newFile) {
    fs.readFile(newFile, 'utf8', function(err, data) {
      if (err) throw err;
      File.path = newFile;
      File.text = data;
      cm.setValue(File.text);
      setWindowTitle(File.path);
      // Add file to recent docs in osx dock
      app.addRecentDocument(File.path);
      console.log('Read a file.');
    });
  } else {
    console.error('No file given');
  }
};

ipc.on('read-file', function(path) {
  File.readFile(path);
});

File.writeFile = function(callback) {
  if (File.path) {
    File.text = cm.getValue();
    fs.writeFile(File.path, File.text, 'utf8', function() {
      console.log('Wrote a file.');
      if (callback) callback();
    });
  } else {
    console.log('no file specified. create new file.');
    File.createFile(callback);
  }
};

ipc.on('write-file', function() {
  File.writeFile();
});

File.createFile = function(callback) {
  dialog.showSaveDialog({ filters: [
     { name: 'Markdown', extensions: ['md', 'markdown'] }
    ]}, function (fileName) {
      if (fileName === undefined) {
        // if dialog gets closed without saving run callback and return
        if (callback) callback();
        return;
      }

      File.path = fileName;
      File.writeFile(function (err){
        if (err === undefined) {
          setWindowTitle(File.path);
        } else {
          dialog.showErrorBox("File Save Error", err.message);
        }
      });
      if (callback) callback();
    }
  );
};
