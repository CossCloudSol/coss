// generate-hero-bg.mjs
// Generates ONE wide abstract tech-pattern hero background image using Gemini 2.5 Flash Image,
// then uploads it to Cloudinary under cosscloudsol/site-images/hero-bg
// Usage:
//   1. Load env vars (Cloudinary + Gemini key)
//   2. node scripts/generate-hero-bg.mjs

import fs from "fs";
import path from "path";
import crypto from "crypto";

const GEMINI_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLD_KEY    = process.env.CLOUDINARY_API_KEY;
const CLD_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!GEMINI_KEY) {
  console.error("ERROR: Set GOOGLE_GEMINI_API_KEY environment variable.");
  process.exit(1);
}
if (!CLOUD_NAME || !CLD_KEY || !CLD_SECRET) {
  console.error("ERROR: Missing Cloudinary env vars.");
  console.error("Required: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  process.exit(1);
}

const MODEL    = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;

const OUTPUT_DIR = path.join(process.cwd(), "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const SLUG   = "hero-bg";
const FOLDER = "cosscloudsol/site-images";

// ── Prompt ────────────────────────────────────────────────────────────────────
// Goal: a wide, purely abstract atmospheric tech-pattern background.
// Brand palette: deep #0f0f1a / #161320 base, teal-cyan accent family
// (#024c57, #03798a, #5ef0c8, #4fd1c5). No text, no objects, no people.
const PROMPT = [
  "An ultra-wide seamless abstract technology background for a cinematic hero banner.",
  "Very dark base: deep navy-black (#0f0f1a) fading to dark teal-navy (#061820) across the canvas.",
  "The entire surface is covered with a delicate flowing mesh of fine circuit-board traces and",
  "organic data-stream curves — rendered as thin luminous filaments glowing softly in teal",
  "(#5ef0c8, #4fd1c5) and deep cyan (#03798a). The lines curve and branch naturally,",
  "occasionally forming small node-dots or intersection rings that pulse with soft light.",
  "Scattered across the upper third: larger hexagonal grid cells rendered at very low opacity",
  "as structural geometry, giving the composition a tech-depth feel.",
  "Three gentle radial light blooms: one large soft teal bloom in the upper-center-right",
  "area (#03798a glow, radius ~35% of image width), one smaller cyan bloom in the far left",
  "middle (#4fd1c5), and a very faint warm-amber accent glow (#e47538 at ~8% opacity)",
  "in the lower-right corner to balance the composition.",
  "The overall mood: dark, premium, cinematic — like looking into a deep high-tech space.",
  "Depth cues: fine foreground lines slightly brighter, background lines almost invisible.",
  "Absolutely NO text, NO logos, NO laptop, NO person, NO recognizable icons or objects.",
  "Pure atmospheric abstract pattern only.",
  "Landscape orientation, 16:9 aspect ratio, photorealistic render quality.",
].join(" ");

// ── Generate ──────────────────────────────────────────────────────────────────
async function generate() {
  console.log("Generating hero background image via Gemini 2.5 Flash Image...");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 500)}`);
  }

  const data  = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const img   = parts.find((p) => p.inlineData);

  if (!img) {
    console.error("No image in response:", JSON.stringify(data, null, 2).slice(0, 800));
    throw new Error("Gemini returned no image data");
  }

  const buffer  = Buffer.from(img.inlineData.data, "base64");
  const outPath = path.join(OUTPUT_DIR, `${SLUG}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`  ✓ Saved locally: ${outPath}`);
  return outPath;
}

// ── Upload ────────────────────────────────────────────────────────────────────
function makeSignature(params, secret) {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(str + secret).digest("hex");
}

async function upload(filePath) {
  console.log("\nUploading to Cloudinary...");

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { folder: FOLDER, public_id: SLUG, timestamp };
  const signature    = makeSignature(paramsToSign, CLD_SECRET);

  const base64  = fs.readFileSync(filePath).toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const form = new URLSearchParams();
  form.append("file",      dataUri);
  form.append("api_key",   CLD_KEY);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("folder",    FOLDER);
  form.append("public_id", SLUG);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Cloudinary error: ${JSON.stringify(data)}`);
  }

  console.log(`  ✓ Cloudinary URL: ${data.secure_url}`);
  return data.secure_url;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  try {
    const filePath = await generate();
    const url      = await upload(filePath);

    // Write URL to a small JSON for easy copy-paste
    const out = { "hero-bg": url };
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "hero-bg-url.json"),
      JSON.stringify(out, null, 2)
    );

    console.log("\n✅ Done!");
    console.log(`\nAdd this URL to your hero component:\n${url}`);
  } catch (err) {
    console.error("\n❌ FAILED:", err.message);
    process.exit(1);
  }
}

main();
