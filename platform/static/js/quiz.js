var answers = {};
var currentQ = 0;
var timerEl = document.getElementById('quizTimer');
var remaining = TIME_LIMIT;
var timerInterval;
var startedAt = Date.now();

function startQuiz() {
  renderQuestion(0);
  timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  remaining--;
  if (timerEl) {
    timerEl.textContent = remaining + 's';
    if (remaining <= 30) timerEl.classList.add('urgent');
  }
  if (remaining <= 0) {
    clearInterval(timerInterval);
    submitQuiz();
  }
}

function renderQuestion(idx) {
  var q = QUESTIONS[idx];
  if (!q) {
    document.getElementById('submitBtn').style.display = 'block';
    document.getElementById('questionsContainer').innerHTML = '<p style="text-align:center;color:#94a3b8">All questions answered!</p>';
    return;
  }
  var html = '<div class="question-card">';
  html += '<div class="question-number">Question ' + (idx + 1) + ' of ' + QUESTIONS.length + ' &nbsp;·&nbsp; ' + typeLabel(q.type) + '</div>';
  html += '<div class="question-text">' + esc(q.question || q.instruction || '') + '</div>';

  if (q.type === 'mcq') {
    html += '<div class="options-grid">';
    q.options.forEach(function(opt) {
      html += '<button class="option-btn" onclick="selectMcq(' + idx + ', this, \'' + esc(opt) + '\')">' + esc(opt) + '</button>';
    });
    html += '</div>';
  } else if (q.type === 'gap_word' || q.type === 'gap_sentence' || q.type === 'open') {
    html += '<input type="text" class="form-control" placeholder="Your answer…" id="openInput_' + idx + '" oninput="answers[\'' + idx + '\']=this.value">';
  } else if (q.type === 'matching') {
    html += '<div class="matching-grid">';
    var pairs = q.pairs || [];
    pairs.forEach(function(p, i) {
      html += '<div>' + esc(p.left) + '</div>';
      html += '<input type="text" class="form-control" placeholder="…" oninput="setMatch(' + idx + ', \'' + esc(p.left) + '\', this.value)">';
    });
    html += '</div>';
  } else if (q.type === 'headings') {
    var sections = q.sections || [];
    var headings = sections.map(function(s) { return s.heading; });
    sections.forEach(function(s) {
      html += '<div style="margin-bottom:0.75rem"><p><em>' + esc(s.text.substring(0, 120)) + '…</em></p>';
      html += '<select class="form-control" onchange="setHeading(' + idx + ', \'' + s.id + '\', this.value)">';
      html += '<option value="">-- Select heading --</option>';
      headings.forEach(function(h) { html += '<option value="' + esc(h) + '">' + esc(h) + '</option>'; });
      html += '</select></div>';
    });
  }

  html += '</div>';
  if (idx < QUESTIONS.length - 1) {
    html += '<button class="btn btn-primary" onclick="nextQuestion(' + idx + ')">Next →</button>';
  } else {
    html += '<button class="btn btn-primary" onclick="submitQuiz()">Submit Answers →</button>';
  }
  document.getElementById('questionsContainer').innerHTML = html;
}

function selectMcq(idx, btn, val) {
  document.querySelectorAll('.option-btn').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
  answers[idx] = val;
}

function setMatch(idx, left, val) {
  if (!answers[idx]) answers[idx] = {};
  answers[idx][left] = val;
}

function setHeading(idx, id, val) {
  if (!answers[idx]) answers[idx] = {};
  answers[idx][id] = val;
}

function nextQuestion(idx) {
  renderQuestion(idx + 1);
}

function submitQuiz() {
  clearInterval(timerInterval);
  var quizSecs = Math.floor((Date.now() - startedAt) / 1000);
  document.getElementById('answersInput').value = JSON.stringify(answers);
  document.getElementById('quizSecs').value = quizSecs;
  document.getElementById('quizForm').submit();
}

function typeLabel(t) {
  var labels = { mcq: 'Multiple Choice', gap_word: 'Fill the Word', gap_sentence: 'Fill the Sentence', matching: 'Matching', headings: 'Match Headings', open: 'Open Answer' };
  return labels[t] || t;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

window.addEventListener('DOMContentLoaded', startQuiz);
