var Countable = require('countable');

var statusbarVisible;

function getStatusBarText (value, text) {
  var statusBarText = value + ' ' + text;
  if (value > 1 || value < 1) {
    statusBarText += 's';
  }
  return statusBarText;
}

function countWords (counter) {
  var statusWords = document.querySelector('.status-words');
  statusWords.innerHTML = getStatusBarText(counter.words, 'word');
}

function countCharacters (counter) {
  var statusChars = document.querySelector('.status-chars');
  statusChars.innerHTML = getStatusBarText(counter.characters, 'character');
}

function setReadingDuration (counter) {
  var statusReading = document.querySelector('.status-duration');

  var wpm = 200,
        estimatedRaw = counter.words / wpm,
        minutes = Math.round(estimatedRaw);

  var effectiveTime = (minutes < 1) ? 'a few seconds' : minutes + ' minutes';

  statusReading.innerHTML = effectiveTime;
}

function renderStatusBarValues () {
  Countable.once(cm.getWrapperElement(), function (counter) {
    countWords(counter);
    countCharacters(counter);
    setReadingDuration(counter);
  });
}
