var remote = require('remote');
var ipc = require('ipc');
var dialog = remote.require('dialog');

var File = function(path) {
  this.path = path;
  this.text = '';
  this.unsaved = true;
  this.changed = false;
};

// File operations

File.prototype.readFile = function(newFile) {
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
};

ipc.on('read-file', function(file) {
  File.readFile(file);
});

File.prototype.writeFile = function(callback) {
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
};

ipc.on('write-file', function() {
  File.writeFile();
});

File.prototype.createFile = function(callback) {
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
};
