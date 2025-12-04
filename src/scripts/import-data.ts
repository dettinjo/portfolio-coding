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

  const idMap: Record<string, Record<string | number, string | number>> = {};

  for (const collection of collections) {
    console.log(`Importing ${collection}...`);
    idMap[collection] = {};

    const docs = data[collection]; // Use the already loaded 'data' variable

    if (!docs) continue; // Added check for safety

    for (const doc of docs) {
      try {
        const oldId = doc.id;
        // Remove internal fields that shouldn't be copied directly if they cause issues
        // But we WANT to preserve IDs if possible.
        // Payload create() usually ignores 'id' unless specifically allowed or using specific adapters.
        // With Drizzle/Postgres, we might need to rely on Payload to handle it.
        // If preserving ID fails, we might get new IDs.

        // Clean up doc
        // const { id, ...rest } = doc; // Don't remove      try {
        // Fixes for specific collections
        if (collection === "users") {
          if (!doc.password) {
            doc.password = "password123";
          }
        }

        if (collection === "skill-categories") {
          if (doc.skills) {
            delete doc.skills;
          }
        }

        // Map relationships
        if (collection === "skills") {
          if (doc.skill_category) {
            const oldCatId =
              typeof doc.skill_category === "object"
                ? doc.skill_category.id
                : doc.skill_category;
            if (
              idMap["skill-categories"] &&
              idMap["skill-categories"][oldCatId]
            ) {
              doc.skill_category = idMap["skill-categories"][oldCatId];
            }
          }

          if (doc.svgIcon) {
            const oldId =
              typeof doc.svgIcon === "object" ? doc.svgIcon.id : doc.svgIcon;
            if (idMap["media"] && idMap["media"][oldId]) {
              doc.svgIcon = idMap["media"][oldId];
            }
          }
        }

        if (collection === "software-projects") {
          if (doc.coverImage) {
            const oldId =
              typeof doc.coverImage === "object"
                ? doc.coverImage.id
                : doc.coverImage;
            if (idMap["media"] && idMap["media"][oldId]) {
              doc.coverImage = idMap["media"][oldId];
            }
          }

          if (doc.gallery && Array.isArray(doc.gallery)) {
            doc.gallery = doc.gallery.map(
              (item: string | { id: string | number }) => {
                const oldId = typeof item === "object" ? item.id : item;
                if (idMap["media"] && idMap["media"][oldId]) {
                  return idMap["media"][oldId];
                }
                return item;
              }
            );
          }
        }

        const result = await payload.create({
          collection: collection as CollectionSlug,
          data: doc, // Pass full doc to preserve ID
        });

        // Store new ID mapping
        idMap[collection][oldId] = result.id;

        console.log(`Imported ${collection} ${doc.id} -> ${result.id}`);
      } catch (e) {
        console.error(`Failed to import ${collection} ${doc.id}:`, e);
      }
    }
  }

  console.log("Import finished!");
  process.exit(0);
};

importData();
