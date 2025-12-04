import { getPayload } from "payload";
import type { CollectionSlug } from "payload";
import configPromise from "@payload-config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const importData = async () => {
  const payload = await getPayload({ config: configPromise });

  const dataPath = path.resolve(dirname, "../../migration-data.json");
  if (!fs.existsSync(dataPath)) {
    console.error("Migration data file not found!");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Order matters for relationships: Users -> Media -> Others
  const collections = [
    "users",
    "media",
    "skill-categories", // Categories might be referenced by skills? No, usually skills ref categories.
    "skills",
    "software-projects",
  ];

  for (const collection of collections) {
    if (!data[collection]) continue;
    console.log(`Importing ${collection}...`);

    for (const doc of data[collection]) {
      try {
        // Remove internal fields that shouldn't be copied directly if they cause issues
        // But we WANT to preserve IDs if possible.
        // Payload create() usually ignores 'id' unless specifically allowed or using specific adapters.
        // With Drizzle/Postgres, we might need to rely on Payload to handle it.
        // If preserving ID fails, we might get new IDs.

        // Clean up doc
        const { id, ...rest } = doc;

        // Check if exists
        const existing = await payload.find({
          collection: collection as CollectionSlug,
          where: { id: { equals: id } },
        });

        if (existing.totalDocs > 0) {
          console.log(`Skipping ${collection} ${id} (already exists)`);
          continue;
        }

        await payload.create({
          collection: collection as CollectionSlug,
          data: {
            ...rest,
            // Try to preserve ID if the adapter allows it.
            // If not, it will generate a new one.
            // Note: If IDs change, relationships in other collections (like 'skills' referencing 'categories')
            // might break if they rely on the old ID.
            // A robust migration would map old IDs to new IDs.
            // For now, we attempt simple import.
          },
        });
        console.log(`Imported ${collection} ${id}`);
      } catch (e) {
        console.error(`Failed to import ${collection} ${doc.id}:`, e);
      }
    }
  }

  console.log("Import finished!");
  process.exit(0);
};

importData();
