import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "./_rateLimit.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AI_RATE_LIMIT_MAX = 60; // requests per 15-minute window
const USER_MSG_MAX_LEN = 4000;
const MAX_TOKENS_CAP = 2048;

const TYPE_EXAMPLES = {
  mcq:          '{"type":"mcq","q":"Question?","options":["A","B","C","D"],"answer":0,"explanation":"Why A is correct."}',
  gap_word:     '{"type":"gap_word","sentence":"The ___ was important.","options":["cat","dog","event","reason"],"answer":2,"explanation":"Because..."}',
  gap_sentence: '{"type":"gap_sentence","sentence":"___ was the main cause.","options":["Sent1","Sent2","Sent3","Sent4"],"answer":0,"explanation":"Because..."}',
  qa:           '{"type":"qa","q":"Open question?","keywords":["word1","word2","word3"],"explanation":"Model answer."}',
  tfnm:         '{"type":"tfnm","instruction":"According to the passage...","q":"Statement.","options":["True","False","Not Mentioned"],"answer":0,"explanation":"..."}',
  ynng:         '{"type":"ynng","instruction":"Do the following statements agree with the claims of the writer?","q":"Statement.","options":["Yes","No","Not Given"],"answer":0,"explanation":"..."}',
};

// matching and heading require complex structured formats — excluded from AI generation
const SUPPORTED_AI_TYPES = new Set(Object.keys(TYPE_EXAMPLES));

const LEVEL_CONFIG = {
  A1: {
    words: "80-100",
    vocab: "ONLY the ~500 most common English words. No idioms, no phrasal verbs, no compound nouns beyond very basic ones (school bus, ice cream).",
    sentences: "Maximum 8 words per sentence. Subject-verb-object order only. ALLOWED tenses: present simple, 'to be', 'have/has got', 'there is/are', the imperative. FORBIDDEN: past tense, future tense, passive voice, modal verbs, any subordinate clauses, any conjunctions other than 'and' and 'but'.",
  },
  A2: {
    words: "100-130",
    vocab: "Basic everyday vocabulary (~1000 words). No academic, technical, or abstract terms. Avoid phrasal verbs except very common ones (get up, look at).",
    sentences: "8-12 words per sentence. ALLOWED tenses: present simple, present continuous, past simple (regular + common irregulars), 'going to' future. ALLOWED structures: comparatives (bigger, more useful), basic connectors (and, but, because, so, when), at most ONE subordinate clause per sentence. FORBIDDEN: present perfect, conditionals, passive voice, reported speech, relative clauses.",
  },
  B1: {
    words: "150-200",
    vocab: "Intermediate vocabulary (~2000 words). Topic-specific words are fine; avoid technical jargon and rare idioms.",
    sentences: "10-15 words per sentence. REQUIRED across the passage (must appear at least once each): present perfect, past continuous, will-future, first conditional, basic passive (was/were + past participle), defining relative clauses (who/which/that), modal verbs (can, could, should, must, might). At least one subordinate clause every 2-3 sentences. FORBIDDEN: third conditional, mixed conditionals, inversion, cleft sentences.",
  },
  B2: {
    words: "200-250",
    vocab: "Upper-intermediate (~4000 words) including academic and abstract terms; common collocations and phrasal verbs.",
    sentences: "12-18 words per sentence. REQUIRED across the passage: past perfect, second AND third conditionals, full passive (all tenses), reported speech, non-defining relative clauses (with commas), modal perfects ('should have done', 'must have been'), participle clauses ('Walking home, she...'). Vary sentence openings — at least two sentences should start with something other than the subject (e.g. an adverbial, a participle).",
  },
  C1: {
    words: "250-320",
    vocab: "Advanced academic + idiomatic vocabulary (~6000+ words). Nuanced register, less-common collocations, figurative phrasal verbs, register-aware word choice.",
    sentences: "15-22 words per sentence on average. REQUIRED across the passage (each at least once): mixed conditionals ('If I had studied, I would now be...'), inversion after negative adverbials ('Never have we seen...', 'Not only does X, but Y also...'), cleft sentences ('What surprises me is...', 'It was X that...'), advanced participle clauses ('Having considered the evidence,...'), the subjunctive ('It is essential that he be...'), and at least two sophisticated cohesion devices (notwithstanding, in spite of which, given that, by which point). Avoid simple SVO openings throughout.",
  },
  C2: {
    words: "300-400",
    vocab: "Native-level vocabulary including rare, literary, and technical terms; idioms; nuanced collocations; register-specific phrasing.",
    sentences: "Average 18-25 words per sentence; sentence length MUST vary noticeably (occasional very short sentences for emphasis are fine). REQUIRED across the passage (each at least once, no exceptions): (1) hypothetical inversion replacing 'if' ('Were he to arrive...', 'Had I known...', 'Should you require...'); (2) fronting for emphasis ('Strange though it may seem,...', 'Such was the impact that...'); (3) ellipsis ('Some preferred coffee; others, tea.'); (4) cleft and pseudo-cleft constructions; (5) nominalisation (turning verbs/adjectives into noun phrases: 'the implementation of', 'the inevitability of'); (6) the subjunctive in formal contexts; (7) discourse markers of formal register (notwithstanding, be that as it may, insofar as, by virtue of). At least ONE sentence must use a structure that would not appear below C2. Plain SVO sentences must be a minority of the passage.",
  },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });
  }

  const body = req.body || {};

  const DB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const ip = ((req.headers["x-forwarded-for"] || req.headers["client-ip"] || "").split(",")[0]).trim();
  const rl = await checkRateLimit(DB, ip, { max: AI_RATE_LIMIT_MAX, bucket: "ai" });
  if (rl.limited) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: "Too many AI requests. Try again later." });
  }

  // ── Mode 1: generic proxy — {messages:[{role,content}]} → {content:[{type,text}]} ──
  if (body.messages && Array.isArray(body.messages)) {
    let userMessage = body.messages[body.messages.length - 1]?.content || "";
    if (!userMessage) {
      return res.status(400).json({ error: "No message provided" });
    }
    if (typeof userMessage === "string" && userMessage.length > USER_MSG_MAX_LEN) {
      userMessage = userMessage.slice(0, USER_MSG_MAX_LEN);
    }
    const requestedTokens = Number(body.max_tokens) || 4096;
    const maxTokens = Math.min(MAX_TOKENS_CAP, Math.max(1, requestedTokens));
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: maxTokens,
        messages: [{ role: "user", content: userMessage }],
      });
      const text = msg.content?.[0]?.text || "";
      if (!text) {
        return res.status(502).json({ error: "Empty model response" });
      }
      return res.status(200).json({ content: [{ type: "text", text }] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── Mode 2: AI assignment generation — {level, topic, types, language} → {passage, questions} ──
  const level = body.level || "B1";
  const topic = body.topic || "General";
  const types = Array.isArray(body.types) ? body.types : ["mcq", "qa"];
  const language = body.language || "English";
  const topicInLanguage =
    typeof body.topic_in_language === "string" && body.topic_in_language.trim()
      ? body.topic_in_language.trim().slice(0, 120)
      : null;

  const lc = LEVEL_CONFIG[level] || LEVEL_CONFIG["B1"];
  const validTypes = types.filter((t) => SUPPORTED_AI_TYPES.has(t)).slice(0, 4);
  if (!validTypes.length) {
    return res.status(400).json({ error: "No valid question types provided" });
  }

  const typeExamples = validTypes.map((t) => "  " + TYPE_EXAMPLES[t]).join(",\n");

  const prompt = `Write a ${lc.words}-word reading passage in ${language} about: "${topic}"

TOPIC ADHERENCE (non-negotiable):
- The word "${topic}" (translated into ${language} if needed) MUST appear in the passage at least twice.
- The first sentence MUST name "${topic}" directly.
- Every paragraph MUST be about "${topic}".
- Do NOT drift to generic subjects (family, school, weather, daily routines) unless that IS the topic.
- If "${topic}" is harder than CEFR ${level} vocabulary, KEEP the word and explain it with simpler words.

CEFR ${level} GRAMMAR ADHERENCE (non-negotiable — both vocab AND structure must match):
- Vocabulary: ${lc.vocab}
- Grammar / sentence structures: ${lc.sentences}
- Do not pull difficulty up by using rarer vocabulary while keeping sentences simple. The grammar profile must match the level just as strictly as the vocabulary does. A passage at this level that uses only plain SVO sentences with advanced words is WRONG.

After the passage, write exactly ${validTypes.length} comprehension question(s) in this order: ${validTypes.join(", ")}

Return ONLY this JSON, no markdown, no explanation:
{
  "topic_echo": "the word(s) for \\"${topic}\\" exactly as you wrote them in ${language} (e.g. \\"Mars\\" → \\"Марс\\" for Russian, \\"المريخ\\" for Arabic, \\"Mars\\" for English). This must appear verbatim in your passage.",
  "passage": "your passage about ${topic}",
  "questions": [
${typeExamples}
  ]
}

- Every question must be answerable from the passage alone.
- answer = 0-based index of the correct option (mcq/gap_word/gap_sentence).
- topic_echo MUST appear in the passage — this is how topic adherence is verified.`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: `You are a CEFR-aligned language learning exercise generator for level ${level} (${language}). You write reading passages about the exact topic the user specifies, never drifting. You match the CEFR level on BOTH dimensions equally: vocabulary AND grammar/sentence structures. A passage with level-appropriate vocab but mid-complexity SVO sentences is incorrect output and must not be returned. At ${level}, the grammatical structures listed in the user prompt are mandatory minimums — at least one occurrence of each required structure must appear in the passage.`,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = msg.content?.[0]?.text;
    if (!rawText) {
      return res.status(502).json({ error: "Empty model response" });
    }
    const raw = rawText.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.passage || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure from Claude");
    }

    // Topic-adherence check: if Claude drifted to a generic passage that does not
    // actually cover the topic, surface it rather than rendering a mismatched
    // title/body. Priority order:
    //   1. `topic_in_language` from the client (independently translated via
    //      MyMemory — Claude cannot fabricate this), if provided.
    //   2. `topic_echo` self-reported by Claude — only used as fallback when no
    //      trusted translation is available.
    //   3. The original `topic` for English requests.
    if (topic && topic !== "General") {
      const candidates = [];
      if (language === "English") candidates.push(topic);
      if (topicInLanguage) {
        candidates.push(topicInLanguage);
      } else if (parsed.topic_echo && typeof parsed.topic_echo === "string") {
        candidates.push(parsed.topic_echo);
      }
      if (candidates.length > 0) {
        const passageLc = parsed.passage.toLowerCase();
        const words = candidates
          .flatMap((c) => c.toLowerCase().split(/\s+/))
          .filter((w) => w.length >= 3);
        if (words.length > 0 && !words.some((w) => passageLc.includes(w))) {
          return res.status(422).json({
            error: `The model drifted off-topic (no mention of "${topic}"). Please try again.`,
          });
        }
      }
    }

    return res.status(200).json({ passage: parsed.passage, questions: parsed.questions });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
