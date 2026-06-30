// upload-category-images.mjs
// Uploads all 12 generated category images to Cloudinary
// Usage: node scripts/upload-category-images.mjs

import fs from "fs";
import path from "path";
import crypto from "crypto";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("ERROR: Missing Cloudinary env vars.");
  console.error("Required: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
  console.error("These should already be in your .env file — load them first:");
  console.error('  Get-Content .env | ForEach-Object { if ($_ -match \'^([^=]+)=(.*)$\') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(\'"\'), "Process") } }');
  process.exit(1);
}

const INPUT_DIR = path.join(process.cwd(), "output");
const FOLDER = "cosscloudsol/site-images/category-illustrations";

const slugs = [
  "data-analytics-bi",
  "cloud-computing",
  "devops-multi-cloud",
  "programming-full-stack",
  "data-engineering",
  "cyber-security",
  "erp-crm-enterprise-tools",
  "software-testing-os",
  "digital-design",
  "professional-soft-skills",
  "certification",
  "quantum-computing",
];

function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto
    .createHash("sha1")
    .update(paramString + apiSecret)
    .digest("hex");
}

async function uploadImage(slug) {
  const filePath = path.join(INPUT_DIR, `${slug}.png`);
  if (!fs.existsSync(filePath)) {
    console.error(`SKIP [${slug}]: File not found at ${filePath}`);
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${FOLDER}/${slug}`;

  const paramsToSign = {
    folder: FOLDER,
    public_id: slug,
    timestamp: timestamp,
  };

  const signature = generateSignature(paramsToSign, API_SECRET);

  const fileBuffer = fs.readFileSync(filePath);
  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const formData = new URLSearchParams();
  formData.append("file", dataUri);
  formData.append("api_key", API_KEY);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", FOLDER);
  formData.append("public_id", slug);

  console.log(`Uploading: ${slug}...`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error(`FAILED [${slug}]: ${JSON.stringify(data)}`);
    return null;
  }

  console.log(`  ✓ ${data.secure_url}`);
  return { slug, url: data.secure_url };
}

async function main() {
  console.log(`Uploading ${slugs.length} images to Cloudinary...\n`);
  const results = [];

  for (const slug of slugs) {
    const result = await uploadImage(slug);
    if (result) results.push(result);
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. ${results.length}/${slugs.length} uploaded.\n`);

  // Write a mapping file for the next step
  const mapping = {};
  results.forEach((r) => {
    mapping[r.slug] = r.url;
  });

  const mappingPath = path.join(process.cwd(), "output", "cloudinary-urls.json");
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`URL mapping saved to: ${mappingPath}`);
  console.log("\nCopy this output and share it back:\n");
  console.log(JSON.stringify(mapping, null, 2));
}

main();
