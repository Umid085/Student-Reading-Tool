#!/usr/bin/env node
// Retry helper for stories that failed during the main sweep. Pass IDs as
// args:  node scripts/retry-library.mjs c2_4 b1_6
//
// Reads src/storyLibrary.js, regenerates questions for the named stories,
// writes the file back. Stories not in the args list are untouched.

import { STORY_LIBRARY } from "../src/storyLibrary.js";
import { readFileSync, writeFileSync } from "node:fs";

const ENDPOINT = process.env.ENDPOINT || "https://student-reading-tool.vercel.app";
const TYPES = ["mcq", "gap_word", "qa", "tfnm"];

const wantedIds = new Set(process.argv.slice(2));
if (!wantedIds.size) {
  console.error("Usage: node scripts/retry-library.mjs <id> [<id> ...]");
  process.exit(1);
}

async function regenerate(story) {
  const r = await fetch(`${ENDPOINT}/api/quiz-from-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passage: story.passage, level: story.level, types: TYPES }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  if (!Array.isArray(d.questions) || d.questions.length < 3) throw new Error("malformed");
  return d.questions;
}

function jsLiteral(value, indent = "  ") {
  const json = JSON.stringify(value, null, 2);
  return json.replace(/^(\s*)"([a-zA-Z_$][a-zA-Z0-9_$]*)":/gm, "$1$2:").replace(/\n/g, "\n" + indent);
}

const updated = [];
for (const s of STORY_LIBRARY) {
  if (!wantedIds.has(s.id)) {
    updated.push(s);
    continue;
  }
  process.stdout.write(`Retrying ${s.id} (${s.level})... `);
  try {
    const qs = await regenerate(s);
    updated.push({ ...s, questions: qs });
    console.log(`✓ ${qs.length} q`);
  } catch (e) {
    console.log(`✗ ${e.message} — keeping previous`);
    updated.push(s);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

const existing = readFileSync("src/storyLibrary.js", "utf8");
const headerMatch = existing.match(/^([\s\S]*?)export const STORY_LIBRARY = \[/);
const header = headerMatch ? headerMatch[1] : "";
const body =
  "export const STORY_LIBRARY = [\n" +
  updated.map((s) => "  " + jsLiteral(s)).join(",\n") +
  "\n];\n";
writeFileSync("src/storyLibrary.js", header + body);
console.log("Wrote src/storyLibrary.js");
