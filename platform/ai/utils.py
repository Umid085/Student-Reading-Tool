import json
from django.conf import settings


def generate_passage_and_quiz(level, topic):
    """Call Claude API and return {passage, questions}."""
    import anthropic
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    prompt = f"""Generate a reading passage for CEFR level {level} on the topic of {topic}.
Then create a 6-question quiz with these types: mcq, gap_word, gap_sentence, matching, headings, open.

Return ONLY valid JSON in this exact format:
{{
  "passage": "The full passage text here...",
  "questions": [
    {{"type": "mcq", "question": "...", "options": ["A","B","C","D"], "correct": "A"}},
    {{"type": "gap_word", "question": "Fill in: The ___ was beautiful.", "correct": "sky"}},
    {{"type": "gap_sentence", "question": "Complete: The student ___.", "correct": "studied hard"}},
    {{"type": "matching", "instruction": "Match the words to definitions", "pairs": [{{"left":"word","right":"definition"}}]}},
    {{"type": "headings", "instruction": "Match headings to sections", "sections": [{{"id":"1","text":"...","heading":"Title"}}]}},
    {{"type": "open", "question": "Describe in your own words...", "correct": "sample answer"}}
  ]
}}"""

    message = client.messages.create(
        model='claude-sonnet-4-6',
        max_tokens=2048,
        messages=[{'role': 'user', 'content': prompt}]
    )
    text = message.content[0].text.strip()
    if text.startswith('```'):
        text = text.split('```')[1]
        if text.startswith('json'):
            text = text[4:]
    return json.loads(text)
