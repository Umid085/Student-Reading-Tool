from django.test import TestCase
from .views import _score_question


class ScoreQuestionTests(TestCase):

    # ── MCQ ──────────────────────────────────────────────────────────────
    def test_mcq_correct(self):
        q = {'type': 'mcq', 'correct': 'B'}
        self.assertEqual(_score_question(q, 'B'), (1, 1))

    def test_mcq_wrong(self):
        q = {'type': 'mcq', 'correct': 'B'}
        self.assertEqual(_score_question(q, 'A'), (0, 1))

    def test_mcq_none_answer(self):
        q = {'type': 'mcq', 'correct': 'B'}
        self.assertEqual(_score_question(q, None), (0, 1))

    # ── Gap fill ─────────────────────────────────────────────────────────
    def test_gap_word_correct_case_insensitive(self):
        q = {'type': 'gap_word', 'correct': 'Sky'}
        self.assertEqual(_score_question(q, 'sky'), (1, 1))

    def test_gap_word_strips_whitespace(self):
        q = {'type': 'gap_word', 'correct': 'rain'}
        self.assertEqual(_score_question(q, '  rain  '), (1, 1))

    def test_gap_word_wrong(self):
        q = {'type': 'gap_word', 'correct': 'rain'}
        self.assertEqual(_score_question(q, 'sun'), (0, 1))

    def test_gap_sentence_correct(self):
        q = {'type': 'gap_sentence', 'correct': 'studied hard'}
        self.assertEqual(_score_question(q, 'Studied Hard'), (1, 1))

    def test_open_correct(self):
        q = {'type': 'open', 'correct': 'sample answer'}
        self.assertEqual(_score_question(q, 'Sample Answer'), (1, 1))

    # ── Matching ──────────────────────────────────────────────────────────
    def test_matching_all_correct(self):
        q = {'type': 'matching', 'pairs': [
            {'left': 'cat', 'right': 'animal'},
            {'left': 'oak', 'right': 'tree'},
        ]}
        self.assertEqual(_score_question(q, {'cat': 'animal', 'oak': 'tree'}), (2, 2))

    def test_matching_partial(self):
        q = {'type': 'matching', 'pairs': [
            {'left': 'cat', 'right': 'animal'},
            {'left': 'oak', 'right': 'tree'},
        ]}
        self.assertEqual(_score_question(q, {'cat': 'animal', 'oak': 'wrong'}), (1, 2))

    def test_matching_none_answer(self):
        q = {'type': 'matching', 'pairs': [{'left': 'cat', 'right': 'animal'}]}
        self.assertEqual(_score_question(q, None), (0, 1))

    def test_matching_empty_pairs(self):
        q = {'type': 'matching', 'pairs': []}
        self.assertEqual(_score_question(q, {}), (0, 0))

    # ── Headings ──────────────────────────────────────────────────────────
    def test_headings_all_correct(self):
        q = {'type': 'headings', 'sections': [
            {'id': '1', 'text': '...', 'heading': 'Introduction'},
            {'id': '2', 'text': '...', 'heading': 'Conclusion'},
        ]}
        self.assertEqual(_score_question(q, {'1': 'Introduction', '2': 'Conclusion'}), (2, 2))

    def test_headings_partial(self):
        q = {'type': 'headings', 'sections': [
            {'id': '1', 'text': '...', 'heading': 'Introduction'},
            {'id': '2', 'text': '...', 'heading': 'Conclusion'},
        ]}
        self.assertEqual(_score_question(q, {'1': 'Introduction', '2': 'Wrong'}), (1, 2))

    def test_headings_none_answer(self):
        q = {'type': 'headings', 'sections': [{'id': '1', 'text': '...', 'heading': 'Intro'}]}
        self.assertEqual(_score_question(q, None), (0, 1))

    # ── Unknown type ──────────────────────────────────────────────────────
    def test_unknown_type(self):
        q = {'type': 'future_type', 'correct': 'x'}
        self.assertEqual(_score_question(q, 'x'), (0, 1))
