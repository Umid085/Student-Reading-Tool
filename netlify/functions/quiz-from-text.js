// Generates a quiz from user-submitted custom text using Claude
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { passage, level = "B1", types = ["mcq", "tfnm", "qa"] } = body;

  if (!passage || passage.trim().length < 30) {
    return { statusCode: 400, body: JSON.stringify({ error: "Passage must be at least 30 characters." }) };
  }
  if (passage.length > 3000) {
    return { statusCode: 400, body: JSON.stringify({ error: "Passage too long (max 3000 characters)." }) };
  }

  const typeDescriptions = {
    mcq: "Multiple-choice question with 4 options (answer is the index 0-3)",
    tfnm: "True/False/Not Mentioned — options are ['True','False','Not Mentioned'] (answer: 0/1/2)",
    ynng: "Yes/No/Not Given — options are ['Yes','No','Not Given'] (answer: 0/1/2)",
    qa: "Open-answer with keywords array (3-5 key words from the ideal answer)",
    gap_word: "Gap-fill word: sentence with ___ and 4 word options (answer is index 0-3)",
  };

  const usedTypes = types.filter((t) => typeDescriptions[t]).slice(0, 4);
  if (!usedTypes.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "No valid question types specified." }) };
  }

  const prompt = `You are a CEFR ${level} English language test designer.

The user has pasted the following passage:
<passage>
${passage.trim()}
</passage>

Generate exactly ${usedTypes.length + 1} quiz questions about this passage. Use these question types (in order): ${usedTypes.join(", ")}, then one more of any type.

Return ONLY a JSON object (no markdown, no explanation):
{
  "topic": "<short title for this passage, 3-6 words>",
  "questions": [
    // mcq example:
    {"type":"mcq","q":"Question text?","options":["A","B","C","D"],"answer":0,"explanation":"Why A is correct."},
    // tfnm example:
    {"type":"tfnm","instruction":"According to the passage...","q":"Statement to evaluate.","options":["True","False","Not Mentioned"],"answer":0,"explanation":"..."},
    // qa example:
    {"type":"qa","q":"Open question?","keywords":["word1","word2","word3"],"explanation":"Model answer."},
    // gap_word example:
    {"type":"gap_word","sentence":"The ___ was important.","options":["cat","dog","event","reason"],"answer":2,"explanation":"Because..."}
  ]
}

Rules:
- All questions must be answerable ONLY from the passage — no outside knowledge.
- Explanations must cite the passage.
- Keep question language appropriate for CEFR ${level}.`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = msg.content[0].text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: parsed.topic || "Custom Passage", questions: parsed.questions }),
    };
  } catch (e) {
    console.error("quiz-from-text error:", e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate quiz. Please try again." }),
    };
  }
};
