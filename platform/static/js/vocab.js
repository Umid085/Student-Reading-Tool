var mode = null;
var idx = 0;
var score = 0;
var total = 0;

function setMode(m) {
  mode = m;
  idx = 0;
  score = 0;
  total = 0;
  document.getElementById('gameScore').style.display = 'flex';
  renderCard();
}

function renderCard() {
  if (idx >= GAME_WORDS.length) {
    document.getElementById('gameArea').innerHTML = '<div class="flashcard"><h2>Game Over!</h2><p>Score: ' + score + ' / ' + total + '</p><button class="btn btn-primary" onclick="setMode(mode)">Play Again</button></div>';
    return;
  }
  updateScore();
  var word = GAME_WORDS[idx];
  if (mode === 'flashcard') renderFlashcard(word);
  else if (mode === 'mcq') renderMcq(word);
  else if (mode === 'fill') renderFill(word);
}

function updateScore() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('totalDisplay').textContent = total;
}

function renderFlashcard(word) {
  var flipped = false;
  document.getElementById('gameArea').innerHTML =
    '<div class="flashcard">' +
    '<div class="flashcard-word">' + word.word + '</div>' +
    '<div class="flashcard-def" id="fcDef" style="display:none">' + word.definition + '</div>' +
    '<button class="btn btn-secondary" onclick="flipCard()">Reveal Definition</button>' +
    '<div id="fcButtons" style="display:none;gap:0.75rem;justify-content:center;margin-top:1rem;display:none">' +
    '<button class="btn btn-danger" onclick="markCard(false)">✗ Hard</button>' +
    '<button class="btn btn-primary" onclick="markCard(true)">✓ Got it</button>' +
    '</div></div>';
}

function flipCard() {
  document.getElementById('fcDef').style.display = 'block';
  document.getElementById('fcButtons').style.display = 'flex';
}

function markCard(correct) {
  total++;
  if (correct) score++;
  checkAndAdvance(GAME_WORDS[idx].id, correct);
}

function renderMcq(word) {
  var others = GAME_WORDS.filter(function(w) { return w.id !== word.id && w.definition; }).sort(function() { return Math.random() - 0.5; }).slice(0, 3);
  var options = [word.definition].concat(others.map(function(w) { return w.definition; })).sort(function() { return Math.random() - 0.5; });
  var html = '<div class="flashcard"><div class="flashcard-word">' + word.word + '</div><div class="options-grid">';
  options.forEach(function(opt) {
    html += '<button class="option-btn" onclick="checkMcq(this, \'' + opt.replace(/'/g, "&#39;") + '\', \'' + word.definition.replace(/'/g, "&#39;") + '\')">' + opt + '</button>';
  });
  html += '</div></div>';
  document.getElementById('gameArea').innerHTML = html;
}

function checkMcq(btn, chosen, correct) {
  total++;
  var right = chosen === correct;
  if (right) { score++; btn.style.background = '#22c55e'; }
  else { btn.style.background = '#ef4444'; }
  document.querySelectorAll('.option-btn').forEach(function(b) { b.disabled = true; });
  setTimeout(function() { checkAndAdvance(GAME_WORDS[idx].id, right); }, 800);
}

function renderFill(word) {
  document.getElementById('gameArea').innerHTML =
    '<div class="flashcard">' +
    '<div class="flashcard-def">' + word.definition + '</div>' +
    '<input type="text" class="form-control" id="fillInput" placeholder="Type the word…" style="margin:1rem 0">' +
    '<button class="btn btn-primary" onclick="checkFill()">Check</button>' +
    '</div>';
  document.getElementById('fillInput').focus();
}

function checkFill() {
  var input = document.getElementById('fillInput').value.trim().toLowerCase();
  var correct = GAME_WORDS[idx].word.toLowerCase();
  total++;
  var right = input === correct;
  if (right) score++;
  var msg = right ? '✅ Correct!' : '❌ Answer: ' + GAME_WORDS[idx].word;
  document.getElementById('gameArea').innerHTML += '<p style="margin-top:0.75rem;font-weight:700">' + msg + '</p>';
  setTimeout(function() { checkAndAdvance(GAME_WORDS[idx].id, right); }, 1000);
}

function checkAndAdvance(wordId, correct) {
  fetch('/vocabulary/game/check/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
    body: JSON.stringify({ word_id: wordId, correct: correct })
  });
  idx++;
  renderCard();
}

function getCookie(name) {
  var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : null;
}
