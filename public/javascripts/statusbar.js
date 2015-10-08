// statusbar

var statusbarVisible;

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
