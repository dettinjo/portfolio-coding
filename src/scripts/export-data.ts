import { getPayload } from "payload";
import type { CollectionSlug } from "payload";
import configPromise from "@payload-config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const exportData = async () => {
  const payload = await getPayload({ config: configPromise });

  const collections = [
    "users",
    "media",
    "software-projects",
    "skills",
    "skill-categories",
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any[]> = {};

  for (const collection of collections) {
    console.log(`Exporting ${collection}...`);
    const { docs } = await payload.find({
      collection: collection as CollectionSlug,
      limit: 10000,
    });
    data[collection] = docs;
  }

  const outputPath = path.resolve(dirname, "../../migration-data.json");
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Export successful! Data saved to ${outputPath}`);
  process.exit(0);
};

exportData();
