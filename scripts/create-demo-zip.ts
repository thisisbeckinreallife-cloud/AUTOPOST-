/**
 * Creates a demo ZIP file for testing import functionality.
 * Run: tsx scripts/create-demo-zip.ts
 * Output: demo-data/demo-batch-2026-04.zip
 */
import "dotenv/config";
import JSZip from "jszip";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const zip = new JSZip();

  const month = zip.folder("2026-04")!;

  // ─── Post 1: Single image ───
  const post1 = month.folder("2026-04-10_post-image")!;
  post1.file("caption.txt", `Spring collection is here! 🌸

Discover our new arrivals — fresh colors, timeless designs.
Shop now at the link in bio.

#spring #newcollection #fashion`);
  post1.file(
    "meta.json",
    JSON.stringify(
      {
        publish_at: "2026-04-10T09:00:00+02:00",
        type: "image",
        business_slug: "demo-brand",
        first_comment: "Comment with questions! 💬",
        location_id: "",
      },
      null,
      2
    )
  );
  // Minimal valid JPEG (1x1 pixel)
  post1.file(
    "media-01.jpg",
    Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBBEhMQUSQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aj3e5p6rU2s7V3F9r4Nae8QrZdxKdyKqiZ/mKKAP/2Q==",
      "base64"
    )
  );

  // ─── Post 2: Carousel ───
  const post2 = month.folder("2026-04-15_post-carousel")!;
  post2.file("caption.txt", `Behind the scenes of our latest shoot 📸

Swipe to see how we created the magic ✨

1. Location scouting
2. Setup
3. The final result

Follow for more BTS content!`);
  post2.file(
    "meta.json",
    JSON.stringify(
      {
        publish_at: "2026-04-15T12:00:00+02:00",
        type: "carousel",
        business_slug: "demo-brand",
        first_comment: "",
        location_id: "",
      },
      null,
      2
    )
  );

  // 3 images for carousel (same minimal JPEG)
  const minJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQMEAgMAAAAAAAAAAAAAAQIDBBEhMQUSQVH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Aj3e5p6rU2s7V3F9r4Nae8QrZdxKdyKqiZ/mKKAP/2Q==",
    "base64"
  );
  post2.file("media-01.jpg", minJpeg);
  post2.file("media-02.jpg", minJpeg);
  post2.file("media-03.jpg", minJpeg);

  // ─── Post 3: Future date (for scheduling) ───
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const futureDateStr = futureDate.toISOString().replace("Z", "+00:00").slice(0, 19) + "+00:00";

  const post3 = month.folder("2026-04-20_post-promo")!;
  post3.file(
    "caption.txt",
    `Exclusive weekend deal! 🎉

Use code SPRING20 for 20% off everything this weekend only.

Link in bio 👆

#sale #discount #weekend`
  );
  post3.file(
    "meta.json",
    JSON.stringify(
      {
        publish_at: futureDateStr,
        type: "image",
        business_slug: "demo-brand",
        first_comment: "",
        location_id: "",
      },
      null,
      2
    )
  );
  post3.file("media-01.jpg", minJpeg);

  // ─── Post 4: Wrong business slug (for validation error demo) ───
  const post4 = month.folder("2026-04-25_post-wrong-business")!;
  post4.file("caption.txt", "This post has a wrong business slug");
  post4.file(
    "meta.json",
    JSON.stringify({
      publish_at: futureDateStr,
      type: "image",
      business_slug: "nonexistent-business",
      first_comment: "",
    })
  );
  post4.file("media-01.jpg", minJpeg);

  // Generate ZIP
  const outDir = path.join(process.cwd(), "demo-data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const content = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  const outPath = path.join(outDir, "demo-batch-2026-04.zip");
  fs.writeFileSync(outPath, content);

  console.log(`\n✅ Demo ZIP created: ${outPath}`);
  console.log(`   Size: ${(content.length / 1024).toFixed(1)} KB`);
  console.log(`   Posts:`);
  console.log(`     - 2026-04-10_post-image (image, PAST → will fail validation)`);
  console.log(`     - 2026-04-15_post-carousel (carousel, PAST → will fail validation)`);
  console.log(`     - 2026-04-20_post-promo (image, FUTURE → will be schedulable)`);
  console.log(
    `     - 2026-04-25_post-wrong-business (image, wrong slug → validation error)\n`
  );
  console.log(`Upload this ZIP to the "demo-brand" business to test the import flow.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
