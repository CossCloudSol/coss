// dead-host-list-cloudinary-folder.mjs
// Lists all public IDs under cosscloudsol/site-images/nextjs-cosscloudsol-com/wp-content/uploads/
// via the Cloudinary Admin API resources-by-prefix endpoint (read-only), to
// diff against our deterministic transform for images that failed direct lookup.
// Usage: node scripts/dead-host-list-cloudinary-folder.mjs

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const PREFIX = "cosscloudsol/site-images/nextjs-cosscloudsol-com/wp-content/uploads/";

async function main() {
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
  let nextCursor;
  const all = [];
  do {
    const params = new URLSearchParams({
      type: "upload",
      prefix: PREFIX,
      max_results: "500",
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload?${params}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const data = await res.json();
    if (data.error) {
      console.error(data.error);
      process.exit(1);
    }
    all.push(...data.resources.map((r) => r.public_id));
    nextCursor = data.next_cursor;
  } while (nextCursor);

  console.log(`Total resources found under prefix: ${all.length}`);
  const fs = await import("fs");
  fs.writeFileSync("dead-host-cloudinary-folder-listing.json", JSON.stringify(all, null, 2));
}

main();
