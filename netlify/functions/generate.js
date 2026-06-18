import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "./_rateLimit.js";
import { consumeUserQuota } from "./_userQuota.js";
import { extractUsername } from "./_session.js";
import { getRandomFromPool, addToPool } from "./_sliderPool.js";

const AI_LOW_TIER = new Set(["A1", "A2", "B1"]);
const AI_QUOTA_LOW = 10;
const AI_QUOTA_HIGH = 6;
const SLIDER_QUOTA = 30;
const AI_RATE_LIMIT_MAX = 60; // requests per 15-minute window (IP-based)
const USER_MSG_MAX_LEN = 4000;
const MAX_TOKENS_CAP = 2048;

const MICRO_WORDS = {
  A1: "55-75", A2: "65-90", B1: "80-110",
  B2: "95-130", C1: "110-150", C2: "130-170",
};

const MICRO_THEMES = [
  "an unusual animal behaviour",
  "a strange historical event",
  "a surprising everyday science fact",
  "a notable invention story",
  "a vivid food origin",
  "an unexpected geographical fact",
  "a tiny moment in space exploration",
  "a person who changed one small thing",
  "an unexpected language fact",
  "a brief sports moment",
];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

// Question count scales with CEFR difficulty. Higher levels = longer passages
// and stronger learners, so they get more comprehension items per session.
const QUESTIONS_PER_LEVEL = { A1: 5, A2: 6, B1: 8, B2: 10, C1: 12, C2: 15 };

const LEVEL_CONFIG = {
  A1: {
    words: "130-170",
    paragraphs: 2,
    vocab: "ONLY the ~500 most common English words. No idioms, no phrasal verbs, no compound nouns beyond very basic ones (school bus, ice cream).",
    sentences: "Maximum 8 words per sentence. Subject-verb-object order only. ALLOWED tenses: present simple, 'to be', 'have/has got', 'there is/are', the imperative. FORBIDDEN: past tense, future tense, passive voice, modal verbs, any subordinate clauses, any conjunctions other than 'and' and 'but'.",
  },
  A2: {
    words: "180-230",
    paragraphs: 2,
    vocab: "Basic everyday vocabulary (~1000 words). No academic, technical, or abstract terms. Avoid phrasal verbs except very common ones (get up, look at).",
    sentences: "8-12 words per sentence. ALLOWED tenses: present simple, present continuous, past simple (regular + common irregulars), 'going to' future. ALLOWED structures: comparatives (bigger, more useful), basic connectors (and, but, because, so, when), at most ONE subordinate clause per sentence. FORBIDDEN: present perfect, conditionals, passive voice, reported speech, relative clauses.",
  },
  B1: {
    words: "260-340",
    paragraphs: 3,
    vocab: "Intermediate vocabulary (~2000 words). Topic-specific words are fine; avoid technical jargon and rare idioms.",
    sentences: "10-15 words per sentence. REQUIRED across the passage (must appear at least once each): present perfect, past continuous, will-future, first conditional, basic passive (was/were + past participle), defining relative clauses (who/which/that), modal verbs (can, could, should, must, might). At least one subordinate clause every 2-3 sentences. FORBIDDEN: third conditional, mixed conditionals, inversion, cleft sentences.",
  },
  B2: {
    words: "360-440",
    paragraphs: 3,
    vocab: "Upper-intermediate (~4000 words) including academic and abstract terms; common collocations and phrasal verbs.",
    sentences: "12-18 words per sentence. REQUIRED across the passage: past perfect, second AND third conditionals, full passive (all tenses), reported speech, non-defining relative clauses (with commas), modal perfects ('should have done', 'must have been'), participle clauses ('Walking home, she...'). Vary sentence openings — at least two sentences should start with something other than the subject (e.g. an adverbial, a participle).",
  },
  C1: {
    words: "460-560",
    paragraphs: 4,
    vocab: "Advanced academic + idiomatic vocabulary (~6000+ words). Nuanced register, less-common collocations, figurative phrasal verbs, register-aware word choice.",
    sentences: "15-22 words per sentence on average. REQUIRED across the passage (each at least once): mixed conditionals ('If I had studied, I would now be...'), inversion after negative adverbials ('Never have we seen...', 'Not only does X, but Y also...'), cleft sentences ('What surprises me is...', 'It was X that...'), advanced participle clauses ('Having considered the evidence,...'), the subjunctive ('It is essential that he be...'), and at least two sophisticated cohesion devices (notwithstanding, in spite of which, given that, by which point). Avoid simple SVO openings throughout.",
  },
  C2: {
    words: "600-750",
    paragraphs: 4,
    vocab: "Native-level vocabulary including rare, literary, and technical terms; idioms; nuanced collocations; register-specific phrasing.",
    sentences: "Average 18-25 words per sentence; sentence length MUST vary noticeably (occasional very short sentences for emphasis are fine). REQUIRED across the passage (each at least once, no exceptions): (1) hypothetical inversion replacing 'if' ('Were he to arrive...', 'Had I known...', 'Should you require...'); (2) fronting for emphasis ('Strange though it may seem,...', 'Such was the impact that...'); (3) ellipsis ('Some preferred coffee; others, tea.'); (4) cleft and pseudo-cleft constructions; (5) nominalisation (turning verbs/adjectives into noun phrases: 'the implementation of', 'the inevitability of'); (6) the subjunctive in formal contexts; (7) discourse markers of formal register (notwithstanding, be that as it may, insofar as, by virtue of). At least ONE sentence must use a structure that would not appear below C2. Plain SVO sentences must be a minority of the passage.",
  },
};

export const handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  // IP rate limit (anonymous callers are exempt from the per-user quota, so
  // this is the only throttle on free-form/Mode-1 abuse). Mirrors api/generate.js.
  const rlDB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const rlIp = ((event.headers && (event.headers["x-forwarded-for"] || event.headers["client-ip"])) || "").split(",")[0].trim();
  const rl = await checkRateLimit(rlDB, rlIp, { max: AI_RATE_LIMIT_MAX, bucket: "ai" });
  if (rl.limited) {
    return { statusCode: 429, headers: { ...CORS, "Retry-After": String(rl.retryAfter) }, body: JSON.stringify({ error: "Too many AI requests. Try again later." }) };
  }

  // ── Mode 1: generic proxy — {messages:[{role,content}]} → {content:[{type,text}]} ──
  if (body.messages && Array.isArray(body.messages)) {
    let userMessage = body.messages[body.messages.length - 1]?.content || "";
    if (!userMessage) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No message provided" }) };
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
        return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Empty model response" }) };
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ content: [{ type: "text", text }] }) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── Mode 4: quiz-from-text — {mode:"quiz_from_text", passage, level, types} → {topic, questions} ──
  if (body.mode === "quiz_from_text") {
    const QFT_QUOTA = 15;
    const qftDB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
    const qftUsername = extractUsername(event);
    const qftQuota = await consumeUserQuota(qftDB, qftUsername, "quiz_from_text", { max: QFT_QUOTA });
    if (qftQuota.exceeded) {
      return {
        statusCode: 429,
        headers: { ...CORS, "Retry-After": String(Math.max(1, Math.ceil((qftQuota.resetAt - Date.now()) / 1000))) },
        body: JSON.stringify({ error: `Daily quiz limit reached (${qftQuota.used}/${qftQuota.max}). Resets at UTC midnight.` }),
      };
    }
    const passage = body.passage;
    const qftLevel = body.level || "B1";
    const qftTypes = Array.isArray(body.types) ? body.types : ["mcq", "tfnm", "qa"];
    if (!passage || typeof passage !== "string" || passage.trim().length < 30) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Passage must be at least 30 characters." }) };
    }
    if (passage.length > 4000) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Passage too long (max 4000 characters)." }) };
    }
    const qftBaseTypes = qftTypes.filter((t) => SUPPORTED_AI_TYPES.has(t));
    if (!qftBaseTypes.length) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No valid question types specified." }) };
    }
    const qftTarget = QUESTIONS_PER_LEVEL[qftLevel] || 6;
    const qftOrdered = [];
    for (let i = 0; i < qftTarget; i++) qftOrdered.push(qftBaseTypes[i % qftBaseTypes.length]);
    const qftUniqueTypes = Array.from(new Set(qftOrdered));
    const qftShapes = qftUniqueTypes.map((t) => `  ${t}: ${TYPE_EXAMPLES[t]}`).join("\n");
    const qftPrompt = `You are a CEFR ${qftLevel} English language test designer.

The passage below has already been written. Generate exactly ${qftTarget} comprehension questions about it, one per slot in this exact order: ${qftOrdered.join(", ")}

Each question object must follow the JSON shape for its type:
${qftShapes}

<passage>
${passage.trim()}
</passage>

Return ONLY this JSON, no markdown, no explanation:
{
  "topic": "short title for this passage, 3-6 words",
  "questions": [ ${qftTarget} question objects in the order listed above ]
}

Rules:
- All questions must be answerable ONLY from the passage — no outside knowledge.
- answer = 0-based index of the correct option (mcq/gap_word/gap_sentence/tfnm/ynng).
- When the same type appears multiple times, each occurrence MUST ask about a DIFFERENT detail from the passage — no repeated stems, no rephrased duplicates.
- Keep question language appropriate for CEFR ${qftLevel}.
- Explanations should cite the passage briefly.`;
    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        messages: [{ role: "user", content: qftPrompt }],
      });
      const rawText = msg.content?.[0]?.text;
      if (!rawText) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Empty model response" }) };
      const raw = rawText.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || !Array.isArray(parsed.questions)) throw new Error("Invalid response structure");
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ topic: parsed.topic || "Custom Passage", questions: parsed.questions }) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to generate quiz. Please try again." }) };
    }
  }

  // ── Mode 3: slider micro-card — {mode:"micro", level, topic?} → {passage, question} ──
  if (body.mode === "micro") {
    const sLevel = (typeof body.level === "string" ? body.level.toUpperCase() : "B1");
    const sWords = MICRO_WORDS[sLevel] || MICRO_WORDS.B1;
    const sUsername = extractUsername(event);
    const sDB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
    const sQuota = await consumeUserQuota(sDB, sUsername, "slider", { max: SLIDER_QUOTA });
    if (sQuota.exceeded) {
      return {
        statusCode: 429,
        headers: { ...CORS, "Retry-After": String(Math.max(1, Math.ceil((sQuota.resetAt - Date.now()) / 1000))) },
        body: JSON.stringify({ error: `Daily slider limit reached (${sQuota.used}/${sQuota.max}). Resets at UTC midnight.` }),
      };
    }

    const seenIds = Array.isArray(body.seen_ids) ? body.seen_ids.filter((s) => typeof s === "string").slice(0, 200) : [];
    const wantsCustomTopic = typeof body.topic === "string" && body.topic.trim().length > 0;
    if (!wantsCustomTopic) {
      const pooled = await getRandomFromPool(sDB, sLevel, seenIds);
      if (pooled && pooled.passage && pooled.question) {
        return { statusCode: 200, headers: CORS, body: JSON.stringify({ passage: pooled.passage, question: pooled.question, topic: pooled.topic || "", id: pooled.id, source: "pool" }) };
      }
    }

    const rawTopic = (typeof body.topic === "string" && body.topic.trim())
      ? body.topic.trim().replace(/[\r\n"]+/g, " ").slice(0, 80)
      : MICRO_THEMES[Math.floor(Math.random() * MICRO_THEMES.length)];
    const sPrompt = `Write ONE self-contained slider micro-passage at CEFR level ${sLevel} about: ${rawTopic}.

Hard constraints:
  - Exactly one paragraph, ${sWords} words.
  - Vocabulary and grammar must match CEFR ${sLevel} — do not exceed it.
  - End with a small payoff (a twist, a vivid image, or a surprising fact) so the reader feels rewarded.
  - No headings, no preamble, no "Did you know" framing — drop the reader straight into the scene/fact.

Then write ONE multiple-choice comprehension question:
  - 4 options, exactly one correct.
  - Tests understanding of the payoff or a load-bearing detail (not trivia outside the passage).
  - Distractors should be plausible but clearly wrong on a careful re-read.

Reply with ONLY a JSON object, no prose around it:
{"passage":"<one paragraph>","question":{"type":"mcq","q":"<question>","options":["A","B","C","D"],"answer":<0|1|2|3>,"explanation":"<one sentence>"}}`;

    try {
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system: `You are a CEFR-aligned slider micro-passage writer. You write tight, engaging one-paragraph passages exactly at level ${sLevel} (both vocab and grammar) followed by one MCQ. Never explain your reasoning, never apologise, never wrap output in code fences.`,
        messages: [{ role: "user", content: sPrompt }],
      });
      const raw = msg.content?.[0]?.text?.trim() || "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Empty or malformed micro response" }) };
      const parsed = JSON.parse(m[0]);
      if (!parsed.passage || !parsed.question || parsed.question.type !== "mcq" ||
          !Array.isArray(parsed.question.options) || parsed.question.options.length !== 4 ||
          typeof parsed.question.answer !== "number") {
        return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Invalid micro response shape" }) };
      }
      let poolId = null;
      if (!wantsCustomTopic) {
        poolId = await addToPool(sDB, sLevel, { passage: parsed.passage, question: parsed.question, topic: rawTopic });
      }
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ passage: parsed.passage, question: parsed.question, topic: rawTopic, id: poolId, source: "claude" }) };
    } catch (e) {
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
    }
  }

  // ── Mode 2: AI assignment generation — {level, topic, types, language} → {passage, questions} ──
  const level = body.level || "B1";
  // Per-user daily quota. Anonymous callers are exempt.
  const aiQuotaMax = AI_LOW_TIER.has(level) ? AI_QUOTA_LOW : AI_QUOTA_HIGH;
  const aiUsername = extractUsername(event);
  const aiDB = (process.env.FIREBASE_DB_URL || "").replace(/\/$/, "");
  const aiQuota = await consumeUserQuota(aiDB, aiUsername, "ai", { max: aiQuotaMax });
  if (aiQuota.exceeded) {
    return {
      statusCode: 429,
      headers: { ...CORS, "Retry-After": String(Math.max(1, Math.ceil((aiQuota.resetAt - Date.now()) / 1000))) },
      body: JSON.stringify({ error: `Daily quest limit reached (${aiQuota.used}/${aiQuota.max}). Resets at UTC midnight — try a library story or come back tomorrow.` }),
    };
  }
  const topic = body.topic || "General";
  const types = Array.isArray(body.types) ? body.types : ["mcq", "qa"];
  const language = body.language || "English";
  const topicInLanguage =
    typeof body.topic_in_language === "string" && body.topic_in_language.trim()
      ? body.topic_in_language.trim().slice(0, 120)
      : null;
  // Vocab integration: words from the user's spaced-repetition queue that the
  // passage should naturally include. Validated as a string array, capped to 5,
  // each word sanitised to a single short token to avoid prompt injection.
  const vocabWords = Array.isArray(body.vocab_words)
    ? body.vocab_words
        .filter((w) => typeof w === "string")
        .map((w) => w.replace(/[\r\n"`]+/g, " ").trim().slice(0, 40))
        .filter((w) => w.length > 0)
        .slice(0, 5)
    : [];

  const lc = LEVEL_CONFIG[level] || LEVEL_CONFIG["B1"];
  const baseTypes = types.filter((t) => SUPPORTED_AI_TYPES.has(t));
  if (!baseTypes.length) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "No valid question types provided" }) };
  }

  // Expand the requested types to the level-appropriate question count by
  // cycling through them in order. e.g. C2 + [mcq, gap_word, qa, tfnm] → 15
  // items, with each type appearing 3–4 times.
  // Caller can override the question count (quest-config popup); clamp to 3–20.
  const reqCount = Number(body.num_questions);
  const targetCount = Number.isFinite(reqCount)
    ? Math.max(3, Math.min(20, Math.round(reqCount)))
    : (QUESTIONS_PER_LEVEL[level] || 6);
  const validTypes = [];
  for (let i = 0; i < targetCount; i++) {
    validTypes.push(baseTypes[i % baseTypes.length]);
  }

  const uniqueTypes = Array.from(new Set(validTypes));
  const typeShapes = uniqueTypes.map((t) => `  ${t}: ${TYPE_EXAMPLES[t]}`).join("\n");

  const prompt = `Write a ${lc.words}-word reading passage in ${language} about: "${topic}"

STRUCTURE (non-negotiable):
- Organise the passage as EXACTLY ${lc.paragraphs} paragraphs.
- Separate paragraphs with a single blank line (a literal "\\n\\n" between paragraphs in the JSON string).
- Each paragraph must form a coherent unit (e.g. introduction → development → ${lc.paragraphs >= 3 ? "supporting detail → " : ""}conclusion${lc.paragraphs >= 4 ? "/implications" : ""}).
- Do NOT use markdown headings, bullet points, or numbered lists inside the passage.

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
${vocabWords.length > 0 ? `
VOCAB INTEGRATION (best effort — never break the CEFR rules above):
- The user is reviewing these words: ${vocabWords.map((w) => `"${w}"`).join(", ")}.
- Naturally weave AT LEAST 3 of them into the passage in a way that fits the topic and the CEFR level.
- If a word would force vocabulary or grammar above CEFR ${level}, OMIT it rather than warp the passage. The CEFR profile takes priority over vocab inclusion.
` : ''}
After the passage, write exactly ${validTypes.length} comprehension questions, one per slot in this exact order: ${validTypes.join(", ")}

Each question object must follow the JSON shape for its type:
${typeShapes}

Return ONLY this JSON, no markdown, no explanation:
{
  "topic_echo": "the word(s) for \\"${topic}\\" exactly as you wrote them in ${language} (e.g. \\"Mars\\" → \\"Марс\\" for Russian, \\"المريخ\\" for Arabic, \\"Mars\\" for English). This must appear verbatim in your passage.",
  "passage": "your passage about ${topic}",
  "questions": [ ${validTypes.length} question objects in the order listed above ]
}

- Every question must be answerable from the passage alone.
- answer = 0-based index of the correct option (mcq/gap_word/gap_sentence).
- When the same type appears multiple times, each occurrence MUST ask about a DIFFERENT detail from the passage — no repeated stems, no rephrased duplicates.
- topic_echo MUST appear in the passage — this is how topic adherence is verified.`;

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      // Passage (up to ~1000 tokens at C2/750 words) + up to 15 question
      // objects (~150 tokens each ≈ 2.3K) + JSON scaffolding. 6000 leaves
      // headroom for the longest C2 case.
      max_tokens: 6000,
      system: `You are a CEFR-aligned language learning exercise generator for level ${level} (${language}). You write reading passages about the exact topic the user specifies, never drifting. You match the CEFR level on BOTH dimensions equally: vocabulary AND grammar/sentence structures. A passage with level-appropriate vocab but mid-complexity SVO sentences is incorrect output and must not be returned. At ${level}, the grammatical structures listed in the user prompt are mandatory minimums — at least one occurrence of each required structure must appear in the passage.`,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText = msg.content?.[0]?.text;
    if (!rawText) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "Empty model response" }) };
    }
    const raw = rawText.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.passage || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response structure from Claude");
    }

    // Topic-adherence check. Candidates checked against the passage:
    //   - `topic` (user's typed string) — always, even for non-English requests
    //     since short Latin-script names like "Mars" or "Tesla" may appear
    //     verbatim in non-English text.
    //   - `topic_in_language` — trusted, client-provided MyMemory translation.
    //     When present, we deliberately SKIP `topic_echo` so Claude can't
    //     fabricate a translation that conveniently matches its drifted output
    //     (covered by the lying-translation test).
    //   - `topic_echo` — Claude's self-reported verbatim form, only when no
    //     trusted translation is available. Lets short topics like "F1" or
    //     "AI" pass when Claude used the abbreviation in the passage.
    //
    // Each candidate accepts the passage if either the full lowercased string
    // appears as a substring (catches short/abbreviation topics) OR any
    // ≥3-char word from it appears (catches multi-word topics where Claude
    // varied wording, e.g. "Formula 1" → "Formula One").
    if (topic && topic !== "General") {
      const candidates = [topic];
      if (topicInLanguage) {
        candidates.push(topicInLanguage);
      } else if (parsed.topic_echo && typeof parsed.topic_echo === "string") {
        candidates.push(parsed.topic_echo);
      }
      const passageLc = parsed.passage.toLowerCase();
      const accepted = candidates.some((c) => {
        const cLc = c.toLowerCase().trim();
        if (!cLc) return false;
        if (cLc.length >= 2 && passageLc.includes(cLc)) return true;
        const words = cLc.split(/\s+/).filter((w) => w.length >= 3);
        return words.some((w) => passageLc.includes(w));
      });
      if (!accepted) {
        return {
          statusCode: 422,
          headers: CORS,
          body: JSON.stringify({
            error: `The model drifted off-topic (no mention of "${topic}"). Please try again.`,
          }),
        };
      }
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ passage: parsed.passage, questions: parsed.questions }),
    };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
