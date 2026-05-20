#!/usr/bin/env node
// One-time sweep: regenerate every story in src/storyLibrary.js with
// level-appropriate question counts via the deployed /api/quiz-from-text
// endpoint. Stories whose AI response fails or returns malformed data
// keep their original questions.
//
// Usage:
//   node scripts/regenerate-library.mjs
//   ENDPOINT=https://preview-foo.vercel.app node scripts/regenerate-library.mjs
//   PACE_MS=2000 node scripts/regenerate-library.mjs
//
// The rate-limit bucket "ai" on Vercel allows 60 requests / 15 min per IP.
// We pace at PACE_MS (default 3s) so 60 stories take ~3 min, well inside
// the window.

import { STORY_LIBRARY } from "../src/storyLibrary.js";
import { readFileSync, writeFileSync } from "node:fs";

const ENDPOINT = process.env.ENDPOINT || "https://student-reading-tool.vercel.app";
const PACE_MS = parseInt(process.env.PACE_MS || "3000", 10);
const TYPES = ["mcq", "gap_word", "qa", "tfnm"];

async function regenerateQuestions(story) {
  const r = await fetch(`${ENDPOINT}/api/quiz-from-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passage: story.passage, level: story.level, types: TYPES }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  if (!Array.isArray(d.questions) || d.questions.length < 3) {
    throw new Error(`malformed: got ${d.questions?.length ?? 0} questions`);
  }
  // Sanity-check structure: every question must have a type and at least a
  // q/sentence/instruction field.
  for (const q of d.questions) {
    if (!q || !q.type) throw new Error("question missing type");
    if (!q.q && !q.sentence && !q.instruction) throw new Error("question missing prompt");
  }
  return d.questions;
}

// Serialize an object as a JS literal with bare identifier keys (matching
// the existing storyLibrary.js style: {id:"a1_1",level:"A1",...}).
function jsLiteral(value, indent = "  ") {
  const json = JSON.stringify(value, null, 2);
  // Promote bare-identifier keys: "foo": → foo:
  return json.replace(/^(\s*)"([a-zA-Z_$][a-zA-Z0-9_$]*)":/gm, "$1$2:").replace(/\n/g, "\n" + indent);
}

async function main() {
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Pacing:   ${PACE_MS}ms between requests`);
  console.log(`Stories:  ${STORY_LIBRARY.length}\n`);

  const updated = [];
  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < STORY_LIBRARY.length; i++) {
    const s = STORY_LIBRARY[i];
    const tag = `[${String(i + 1).padStart(2, "0")}/${STORY_LIBRARY.length}] ${s.id} (${s.level})`;
    process.stdout.write(`${tag}... `);
    try {
      const qs = await regenerateQuestions(s);
      updated.push({ ...s, questions: qs });
      console.log(`✓ ${qs.length} q`);
      okCount++;
    } catch (e) {
      console.log(`✗ ${e.message} — keeping original (${s.questions.length} q)`);
      updated.push(s);
      failCount++;
    }
    if (i < STORY_LIBRARY.length - 1) {
      await new Promise((r) => setTimeout(r, PACE_MS));
    }
  }

  // Preserve the file's header comment, replace the array.
  const existing = readFileSync("src/storyLibrary.js", "utf8");
  const headerMatch = existing.match(/^([\s\S]*?)export const STORY_LIBRARY = \[/);
  const header = headerMatch ? headerMatch[1] : "";

  const body =
    "export const STORY_LIBRARY = [\n" +
    updated.map((s) => "  " + jsLiteral(s)).join(",\n") +
    "\n];\n";

  writeFileSync("src/storyLibrary.js", header + body);

  console.log(`\nDone: ${okCount} regenerated, ${failCount} kept original`);
  console.log(`Wrote src/storyLibrary.js`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
