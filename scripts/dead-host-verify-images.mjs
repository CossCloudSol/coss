// dead-host-verify-images.mjs
// Phase 1b: for every unique /wp-content/uploads/... image path found by
// dead-host-extract.mjs, derive the deterministic Cloudinary public ID and
// verify it actually exists via the Cloudinary Admin API (read-only lookup,
// no uploads/deletes). Writes dead-host-image-mapping.json.
// Usage: node scripts/dead-host-verify-images.mjs

import fs from "fs";
import path from "path";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error("Missing CLOUDINARY_* env vars. Load .env(.local) into the process env first.");
  process.exit(1);
}

const FOLDER_PREFIX = "cosscloudsol/site-images/nextjs-cosscloudsol-com";

function deriveVublicId(urlPath) {
  // urlPath e.g. /wp-content/uploads/2024/11/Digital-Marketing-Training-Institute.jpg
  const decoded = decodeURIComponent(urlPath);
  const trimmed = decoded.replace(/^\/+/, "");
  const segments = trimmed.split("/");
  const last = segments[segments.length - 1];
  const dot = last.lastIndexOf(".");
  if (dot === -1) return `${FOLDER_PREFIX}/${trimmed}`;
  const name = last.slice(0, dot);
  const ext = last.slice(dot + 1).toLowerCase();
  segments[segments.length - 1] = `${name}-${ext}`;
  return { publicId: `${FOLDER_PREFIX}/${segments.join("/")}`, ext };
}

async function verifyPublicId(publicId) {
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload/${encodeURIComponent(publicId).replace(/%2F/g, "/")}`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (res.status === 200) {
    const data = await res.json();
    return { exists: true, version: data.version, format: data.format, secureUrl: data.secure_url };
  }
  if (res.status === 404) return { exists: false };
  const text = await res.text();
  throw new Error(`Unexpected Cloudinary status ${res.status}: ${text}`);
}

async function main() {
  const occ = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "dead-host-occurrences.json"), "utf8")
  );
  const uniqueImagePaths = [
    ...new Set(
      occ.occurrences
        .filter((o) => /^\/wp-content\/uploads\//.test(o.urlPath))
        .map((o) => o.urlPath)
    ),
  ];

  console.log(`Verifying ${uniqueImagePaths.length} unique image paths against Cloudinary...`);

  const results = [];
  let verified = 0;
  let missing = 0;
  for (const urlPath of uniqueImagePaths) {
    const { publicId, ext } = deriveVublicId(urlPath);
    try {
      const v = await verifyPublicId(publicId);
      if (v.exists) {
        verified++;
        results.push({
          oldPath: urlPath,
          publicId,
          verified: true,
          deliveryUrl: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto/${publicId}`,
        });
      } else {
        missing++;
        results.push({ oldPath: urlPath, publicId, verified: false });
      }
    } catch (e) {
      missing++;
      results.push({ oldPath: urlPath, publicId, verified: false, error: String(e.message || e) });
    }
    // gentle pacing
    await new Promise((r) => setTimeout(r, 60));
  }

  fs.writeFileSync(
    path.join(process.cwd(), "dead-host-image-mapping.json"),
    JSON.stringify({ verified, missing, total: uniqueImagePaths.length, results }, null, 2)
  );

  console.log(`Verified: ${verified}/${uniqueImagePaths.length}`);
  console.log(`Missing/unresolved: ${missing}`);
  if (missing > 0) {
    console.log("Missing paths:");
    for (const r of results.filter((r) => !r.verified)) {
      console.log(` - ${r.oldPath}  ->  ${r.publicId}${r.error ? `  (${r.error})` : ""}`);
    }
  }
}

main();
