import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const API_KEY = "AIzaSyAo8T4I8AaZEmOUq_m2obSrLDUSWABWyUY";
const client = new GoogleGenerativeAI(API_KEY);

const badges = [
  {
    id: "a1",
    level: "A1",
    color: "#22c55e",
    symbol: "SPROUT or SEEDLING emerging from soil",
    hex: "bright green",
  },
  {
    id: "a2",
    level: "A2",
    color: "#16a34a",
    symbol: "OPEN BOOK illustration",
    hex: "darker green",
  },
  {
    id: "b1",
    level: "B1",
    color: "#f59e0b",
    symbol: "FLAME or TORCH burning",
    hex: "amber",
  },
  {
    id: "b2",
    level: "B2",
    color: "#d97706",
    symbol: "RISING STAR or ascending arrow",
    hex: "darker amber",
  },
  {
    id: "c1",
    level: "C1",
    color: "#6366f1",
    symbol: "CRYSTAL, GEM, or geometric shape",
    hex: "indigo",
  },
  {
    id: "c2",
    level: "C2",
    color: "#ec4899",
    symbol: "CROWN or DIAMOND shape",
    hex: "pink",
  },
];

async function generateBadge(badge) {
  const prompt = `
A gaming-style badge icon (256x256px square) for a language learning app. Dark sci-fi aesthetic with neon glow.

Central symbol: A ${badge.symbol}, glowing with an intense neon aura in ${badge.hex} (${badge.color}). Sharp glowing edges. Professional polish.

Background: Deep navy-black (#0a0e27 or similar dark color). Subtle sci-fi texture. No transparency.

Text: "${badge.level}" in modern bold sans-serif font, positioned below the symbol. Same neon ${badge.hex} color as the symbol glow.

Composition: Perfectly centered. Square 1:1 ratio. No background transparency.

Style: Professional gaming badge, similar to esports team rank icons. Neon outlines. Minimal design. Clean and readable.
`;

  console.log(`\n🎨 Generating ${badge.level} badge...`);

  try {
    const model = client.getGenerativeModel({
      model: "gemini-2.5-flash-image",
    });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1024,
      },
    });

    const imageData = response.response.candidates[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!imageData) {
      console.log(`❌ ${badge.level}: No image data returned`);
      return false;
    }

    const buffer = Buffer.from(imageData, "base64");
    const outputPath = path.join(
      "public/assets/badges",
      `badge-${badge.id}.png`
    );

    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ ${badge.level}: Saved to ${outputPath} (${buffer.length} bytes)`);
    return true;
  } catch (error) {
    console.error(`❌ ${badge.level} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🎯 Generating 6 CEFR Level Badges...\n");

  let success = 0;
  for (const badge of badges) {
    const result = await generateBadge(badge);
    if (result) success++;

    // Rate limit: 1 second between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n✨ Generated ${success}/${badges.length} badges`);
}

main();
