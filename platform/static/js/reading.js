var startTime, timerInterval, wordCount, speechRate = 1, activeSentenceEl = null;

function initReading(sessionId, words) {
  wordCount = words;
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
  setupHeatmap();
  setupWordPopup();
}

function updateTimer() {
  var elapsed = Math.floor((Date.now() - startTime) / 1000);
  var mins = Math.floor(elapsed / 60);
  var secs = elapsed % 60;
  var timeStr = mins + ':' + (secs < 10 ? '0' : '') + secs;
  document.getElementById('timer').textContent = timeStr;
  var focusTimerEl = document.getElementById('focusTimer');
  if (focusTimerEl) focusTimerEl.textContent = timeStr;
  var wpm = wordCount > 0 && elapsed > 0 ? Math.round(wordCount / (elapsed / 60)) : 0;
  document.getElementById('wpmDisplay').textContent = wpm + ' WPM';
}

document.getElementById('finishForm') && document.getElementById('finishForm').addEventListener('submit', function() {
  clearInterval(timerInterval);
  var elapsed = Math.floor((Date.now() - startTime) / 1000);
  var wpm = wordCount > 0 && elapsed > 0 ? Math.round(wordCount / (elapsed / 60)) : 0;
  document.getElementById('timeSecs').value = elapsed;
  document.getElementById('wpmInput').value = wpm;
});

function updateRate(val) { speechRate = parseFloat(val); }

function speakAll() {
  var text = document.getElementById('passage').innerText;
  window.speechSynthesis.cancel();
  var utt = new SpeechSynthesisUtterance(text);
  utt.rate = speechRate;
  window.speechSynthesis.speak(utt);
}

function stopSpeech() { window.speechSynthesis.cancel(); }

function toggleHeatmap() {
  var passage = document.getElementById('passage');
  var on = passage.dataset.heatmap === '1';
  if (on) {
    passage.querySelectorAll('.heatmap-word').forEach(function(el) {
      el.outerHTML = el.textContent;
    });
    passage.dataset.heatmap = '0';
  } else {
    var common = new Set('a about above after again against all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from get had has have having he her here him himself his how if in into is it its itself just know let like make may me more most my no not now of on once only or our out over own said same she should so some such than that the their them then there these they this through time to too under until up us very was we were what when where which while who will with would you your'.split(' '));
    passage.innerHTML = passage.innerHTML.replace(/\b([a-zA-Z]{4,})\b/g, function(m) {
      return common.has(m.toLowerCase()) ? m : '<span class="heatmap-word" data-word="' + m + '">' + m + '</span>';
    });
    passage.querySelectorAll('.heatmap-word').forEach(function(el) {
      el.addEventListener('click', function() { showPopup(this.dataset.word); });
    });
    passage.dataset.heatmap = '1';
  }
}

function setupHeatmap() {}

function setupWordPopup() {
  document.getElementById('passage') && document.getElementById('passage').addEventListener('mouseup', function() {
    var sel = window.getSelection();
    if (sel && sel.toString().trim().split(' ').length === 1 && sel.toString().trim().length > 2) {
      showPopup(sel.toString().trim());
    }
  });
}

function showPopup(word) {
  var popup = document.getElementById('vocabPopup');
  document.getElementById('popupWord').textContent = word;
  popup.dataset.word = word;
  popup.classList.remove('hidden');
}

function closePopup() { document.getElementById('vocabPopup').classList.add('hidden'); }

function saveWord() {
  var word = document.getElementById('vocabPopup').dataset.word;
  if (!word) return;
  fetch('/vocabulary/add/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-CSRFToken': getCookie('csrftoken') },
    body: 'word=' + encodeURIComponent(word) + '&definition='
  }).then(function() { closePopup(); });
}

function toggleFocusMode() {
  var active = document.body.classList.toggle('focus-mode');
  var focusBar = document.getElementById('focusBar');
  var btn = document.getElementById('focusBtn');
  if (active) {
    focusBar.classList.remove('hidden');
    if (btn) btn.textContent = '⛶ Exit Focus';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    focusBar.classList.add('hidden');
    if (btn) btn.textContent = '⛶ Focus';
  }
}

function getCookie(name) {
  var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}
