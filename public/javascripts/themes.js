var ipc = require('electron').ipcRenderer;
var settings = require('./settings');

function createLink(name) {
  var link = document.createElement( "link" );
  link.href = "public/stylesheets/theme-" + name + ".css";
  link.type = "text/css";
  link.rel = "stylesheet";
  link.media = "screen";
  return link;
}

function toggleTheme(name) {
  var themes = document.head.querySelectorAll('[href*=theme]');
  for (var i = 0; i < themes.length; i++) {
    document.head.removeChild(themes[i]);
  }

  setTheme(name);

  var editorSettings = settings.readSettings();
  editorSettings.theme = name;
  settings.writeSettings(editorSettings);
}

function setTheme(name) {
  // base theme
  if (name == 'gin')
    return;
  var link = createLink(name);
  document.head.appendChild(link);
}

ipc.on('load-settings', function(editorSettings) {
  if (editorSettings.theme)
    toggleTheme(editorSettings.theme);
});

ipc.on('toggle-theme', function(event, name) {
  toggleTheme(name);
});

ipc.on('set-theme', function(event, name) {
  setTheme(name);
});
