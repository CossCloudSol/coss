// generate-category-images.mjs
// Generates 12 dark cinematic category illustrations using Gemini 2.5 Flash Image (Nano Banana)
// Usage: GOOGLE_GEMINI_API_KEY=your_key node generate-category-images.mjs

import fs from "fs";
import path from "path";

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error("ERROR: Set GOOGLE_GEMINI_API_KEY environment variable first.");
  console.error("PowerShell: $env:GOOGLE_GEMINI_API_KEY=\"your_key_here\"");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const OUTPUT_DIR = path.join(process.cwd(), "output");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Shared style prefix — keeps all 12 images visually consistent
const STYLE_PREFIX =
  "A premium 3D rendered illustration in a dark cinematic style. " +
  "Deep purple-to-navy gradient background with a subtle starfield and faint geometric " +
  "constellation lines. Glossy modern laptop computer in the foreground/center, angled " +
  "three-quarter view, screen displaying glowing UI elements relevant to the theme. " +
  "Soft volumetric lighting, glassmorphism, high detail, professional tech marketing " +
  "illustration style, no text or words anywhere in the image, 16:9 aspect ratio, " +
  "vibrant accent color glow matching the theme color.";

const categories = [
  {
    slug: "data-analytics-bi",
    color: "violet and blue",
    theme:
      "data analytics dashboard on the laptop screen with bar charts, donut charts, and line graphs in violet and blue gradients, with floating 3D bar chart pillars and a pie chart beside the laptop",
  },
  {
    slug: "cloud-computing",
    color: "sky blue",
    theme:
      "cloud computing dashboard with a glowing 3D cloud icon, server stack, and network nodes floating beside the laptop, blue gradient glow",
  },
  {
    slug: "devops-multi-cloud",
    color: "teal and emerald",
    theme:
      "DevOps pipeline visualization on screen with infinity loop icon, container/box icons floating in 3D beside the laptop, teal gradient glow",
  },
  {
    slug: "programming-full-stack",
    color: "coral and orange",
    theme:
      "code editor on the laptop screen with colorful syntax highlighting, floating 3D code brackets and terminal window beside the laptop, coral and orange gradient glow",
  },
  {
    slug: "data-engineering",
    color: "indigo",
    theme:
      "data pipeline and ETL workflow diagram on screen with connected database cylinder icons, floating 3D database stack beside the laptop, indigo gradient glow",
  },
  {
    slug: "cyber-security",
    color: "emerald green",
    theme:
      "cybersecurity dashboard with a glowing shield and padlock icon on screen, floating 3D shield with lock beside the laptop, green gradient glow",
  },
  {
    slug: "erp-crm-enterprise-tools",
    color: "red and pink",
    theme:
      "enterprise CRM dashboard on screen with building/office icon, floating 3D building skyscraper icon and chart beside the laptop, red gradient glow",
  },
  {
    slug: "software-testing-os",
    color: "cyan",
    theme:
      "software testing dashboard on screen with a magnifying glass over code and a bug icon, floating 3D test tube and checkmark beside the laptop, cyan gradient glow",
  },
  {
    slug: "digital-design",
    color: "pink and magenta",
    theme:
      "UI/UX design tool on screen with color palette and design frames, floating 3D paint palette and brush beside the laptop, pink gradient glow",
  },
  {
    slug: "professional-soft-skills",
    color: "amber",
    theme:
      "presentation/leadership dashboard on screen with a person icon climbing steps, floating 3D podium and growth chart beside the laptop, amber gradient glow",
  },
  {
    slug: "certification",
    color: "violet",
    theme:
      "certification dashboard on screen with a certificate and badge icon, floating 3D award medal and certificate scroll beside the laptop, violet gradient glow",
  },
  {
    slug: "quantum-computing",
    color: "deep purple",
    theme:
      "quantum computing visualization on screen with atomic orbital patterns, floating 3D atom model with glowing electron orbits beside the laptop, deep purple gradient glow",
  },
];

async function generateImage(category) {
  const prompt = `${STYLE_PREFIX} Theme: ${category.theme}. Primary accent color: ${category.color}.`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
    },
  };

  console.log(`Generating: ${category.slug}...`);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`FAILED [${category.slug}]: ${res.status} ${errText}`);
    return false;
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);

  if (!imagePart) {
    console.error(`FAILED [${category.slug}]: No image data in response`);
    console.error(JSON.stringify(data, null, 2).slice(0, 500));
    return false;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, "base64");
  const outPath = path.join(OUTPUT_DIR, `${category.slug}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`  ✓ Saved: ${outPath}`);
  return true;
}

async function main() {
  console.log(`Generating ${categories.length} category illustrations...\n`);
  let success = 0;
  let failed = 0;

  for (const category of categories) {
    const ok = await generateImage(category);
    if (ok) success++;
    else failed++;
    // Rate limit pause between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
}

main();
