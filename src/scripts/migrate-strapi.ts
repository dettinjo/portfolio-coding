/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { getPayload } from "payload";
import configPromise from "@payload-config";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const STRAPI_EXPORT_DIR = path.resolve(__dirname, "../../strapi/content");
const ENTITIES_FILE = path.join(
  STRAPI_EXPORT_DIR,
  "entities/entities_00001.jsonl"
);
const LINKS_FILE = path.join(STRAPI_EXPORT_DIR, "links/links_00001.jsonl");
const ASSETS_DIR = path.join(STRAPI_EXPORT_DIR, "assets/uploads");

// ID Mappings
const mediaMap = new Map<number, string>(); // Strapi ID -> Payload ID
const skillCategoryMap = new Map<number, string>();
const skillMap = new Map<number, string>();
const projectMap = new Map<number, string>();

const docIdMap = new Map<string, string>(); // Document ID -> Entity Unique Key
const entityMap = new Map<string, any>(); // Entity Unique Key -> Entity Data

// Relations Map: Entity Unique Key -> FieldName -> Target Unique Key[]
const relationsMap = new Map<string, Map<string, string[]>>();

// Helper to generate unique key
const getKey = (type: string, id: number) => `${type}:${id}`;

function addRelation(sourceKey: string, field: string, targetKey: string) {
  if (!relationsMap.has(sourceKey)) {
    relationsMap.set(sourceKey, new Map());
  }
  const fields = relationsMap.get(sourceKey)!;
  if (!fields.has(field)) {
    fields.set(field, []);
  }
  fields.get(field)!.push(targetKey);
}

async function migrate() {
  console.log("Starting migration...");

  const payload = await getPayload({ config: configPromise });

  // 1. Read Entities
  console.log("Reading entities...");
  const fileStream = fs.createReadStream(ENTITIES_FILE);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const entity = JSON.parse(line);
        const key = getKey(entity.type, entity.id);
        entityMap.set(key, entity);
        if (entity.data.documentId) {
          docIdMap.set(entity.data.documentId, key);
        }
      } catch (e) {
        console.error("Failed to parse entity line:", line);
      }
    }
  }
  console.log(`Loaded ${entityMap.size} entities.`);

  // 2. Read Links
  console.log("Reading links...");
  if (fs.existsSync(LINKS_FILE)) {
    const linkStream = fs.createReadStream(LINKS_FILE);
    const rlLinks = readline.createInterface({
      input: linkStream,
      crlfDelay: Infinity,
    });

    for await (const line of rlLinks) {
      if (line.trim()) {
        try {
          const link = JSON.parse(line);
          // Handle different relation types

          // Case 1: Basic Relation (Left -> Right)
          if (link.kind === "relation.basic") {
            const leftKey = getKey(link.left.type, link.left.ref);
            const rightKey = getKey(link.right.type, link.right.ref);

            addRelation(leftKey, link.left.field, rightKey);
            if (link.right.field) {
              addRelation(rightKey, link.right.field, leftKey);
            }
          }

          // Case 2: Morph Relation (Left is File usually, Right is Entity)
          else if (link.kind === "relation.morph") {
            const leftKey = getKey(link.left.type, link.left.ref);
            const rightKey = getKey(link.right.type, link.right.ref);

            // Right entity has field pointing to Left file
            addRelation(rightKey, link.right.field, leftKey);
          }

          // Case 3: Circular/Localization
          else if (
            link.kind === "relation.circular" &&
            link.left.field === "localizations"
          ) {
            const leftKey = getKey(link.left.type, link.left.ref);
            const targetDocId = link.right.ref;
            const targetEntityKey = docIdMap.get(targetDocId);

            if (targetEntityKey) {
              addRelation(leftKey, "localizations", targetEntityKey);
              addRelation(targetEntityKey, "localizations", leftKey);
            }
          }
        } catch (e) {
          console.error("Failed to parse link line:", line);
        }
      }
    }
  }
  console.log("Links processed.");

  // --- CLEANUP ---
  console.log("\n--- Cleaning up existing data ---");
  try {
    await payload.delete({
      collection: "software-projects",
      where: { id: { exists: true } },
    });
    await payload.delete({
      collection: "skills",
      where: { id: { exists: true } },
    });
    await payload.delete({
      collection: "skill-categories",
      where: { id: { exists: true } },
    });
    console.log("Collections cleared.");
  } catch (e) {
    console.error("Failed to clear collections:", e);
  }

  // 3. Migrate Media
  console.log("\n--- Migrating Media ---");
  const mediaEntities = Array.from(entityMap.values()).filter(
    (e) => e.type === "plugin::upload.file"
  );

  for (const entity of mediaEntities) {
    const { id, data } = entity;
    const fileName = data.name;
    const fileHashName = data.hash + data.ext;
    const filePath = path.join(ASSETS_DIR, fileHashName);

    if (fs.existsSync(filePath)) {
      try {
        const existingMedia = await payload.find({
          collection: "media",
          where: { alt: { equals: data.alternativeText || data.name } },
        });

        if (existingMedia.docs.length > 0) {
          mediaMap.set(id, existingMedia.docs[0].id as string);
          continue;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const mediaDoc = await payload.create({
          collection: "media",
          data: { alt: data.alternativeText || data.name },
          file: {
            data: fileBuffer,
            name: fileName,
            mimetype: data.mime,
            size: data.size * 1000,
          },
        });
        mediaMap.set(id, mediaDoc.id as string);
        console.log(`Migrated media: ${fileName}`);
      } catch (error) {
        console.error(`Failed to migrate media ${fileName}:`, error);
      }
    }
  }

  // Helper to get relation
  const getRel = (key: string, field: string) => {
    const fields = relationsMap.get(key);
    if (!fields) return [];
    return fields.get(field) || [];
  };

  // Helper to extract ID from key
  const getIdFromKey = (key: string) =>
    parseInt(key.substring(key.lastIndexOf(":") + 1));

  // 4. Migrate Skill Categories (EN)
  console.log("\n--- Migrating Skill Categories (EN) ---");
  const categoryEntities = Array.from(entityMap.values()).filter(
    (e) => e.type === "api::skill-category.skill-category"
  );

  for (const entity of categoryEntities) {
    if (entity.data.locale === "en") {
      try {
        const doc = await payload.create({
          collection: "skill-categories",
          data: { name: entity.data.name, order: entity.data.order },
        });
        skillCategoryMap.set(entity.id, doc.id as string);
        console.log(`Migrated category: ${entity.data.name}`);
      } catch (e) {
        console.error(`Failed to migrate category ${entity.data.name}:`, e);
      }
    }
  }
  console.log("Skill Category Map Keys:", Array.from(skillCategoryMap.keys()));

  // 5. Migrate Skills (EN)
  console.log("\n--- Migrating Skills (EN) ---");
  const skillEntities = Array.from(entityMap.values()).filter(
    (e) => e.type === "api::skill.skill"
  );
  const categorySkillsMap = new Map<string, string[]>();

  for (const entity of skillEntities) {
    if (entity.data.locale === "en") {
      try {
        const key = getKey(entity.type, entity.id);

        // Resolve Category
        const catKeys = getRel(key, "skill_category");
        let categoryId = null;
        if (catKeys.length > 0) {
          const catId = getIdFromKey(catKeys[0]);
          categoryId = skillCategoryMap.get(catId);
        }

        console.log(
          `Debug Skill ${entity.data.name}: catKeys=${JSON.stringify(catKeys)}, categoryId=${categoryId}`
        );

        // Resolve Icon
        const iconKeys = getRel(key, "svgIcon");
        let iconId = null;
        if (iconKeys.length > 0) {
          const mediaId = getIdFromKey(iconKeys[0]);
          iconId = mediaMap.get(mediaId);
        }

        const doc = await payload.create({
          collection: "skills",
          data: {
            name: entity.data.name,
            level: entity.data.level,
            iconClassName: entity.data.iconClassName,
            url: entity.data.url,
            skill_category: categoryId,
            svgIcon: iconId,
          },
        });
        skillMap.set(entity.id, doc.id as string);
        console.log(`Migrated skill: ${entity.data.name}`);

        if (categoryId) {
          const current = categorySkillsMap.get(categoryId) || [];
          current.push(doc.id as string);
          categorySkillsMap.set(categoryId, current);
        }
      } catch (e) {
        console.error(`Failed to migrate skill ${entity.data.name}:`, e);
      }
    }
  }

  // Update Categories with Skills
  console.log("\n--- Updating Skill Categories with Skills ---");
  for (const [catId, skillIds] of categorySkillsMap.entries()) {
    await payload.update({
      collection: "skill-categories",
      id: catId,
      data: { skills: skillIds },
    });
  }

  // 6. Migrate Projects (EN)
  console.log("\n--- Migrating Projects (EN) ---");
  const projectEntities = Array.from(entityMap.values()).filter(
    (e) => e.type === "api::software-project.software-project"
  );
  const processedSlugs = new Set<string>();
  const slugToPayloadIdMap = new Map<string, string>();

  for (const entity of projectEntities) {
    if (entity.data.locale === "en") {
      if (processedSlugs.has(entity.data.slug)) {
        const existingPayloadId = slugToPayloadIdMap.get(entity.data.slug);
        if (existingPayloadId) {
          projectMap.set(entity.id, existingPayloadId);
          console.log(
            `Mapped duplicate project ${entity.data.title} (ID ${entity.id}) to existing Payload ID ${existingPayloadId}`
          );
        }
        continue;
      }
      processedSlugs.add(entity.data.slug);

      try {
        const key = getKey(entity.type, entity.id);

        const coverKeys = getRel(key, "coverImage");
        let coverImageId = null;
        if (coverKeys.length > 0) {
          const mediaId = getIdFromKey(coverKeys[0]);
          coverImageId = mediaMap.get(mediaId);
        }

        const galleryKeys = getRel(key, "gallery");
        const galleryIds = galleryKeys
          .map((k) => {
            const mid = getIdFromKey(k);
            return mediaMap.get(mid);
          })
          .filter(Boolean) as string[];

        const doc = await payload.create({
          collection: "software-projects",
          data: {
            title: entity.data.title,
            slug: entity.data.slug,
            description: entity.data.description,
            longDescription: entity.data.longDescription,
            projectType: entity.data.projectType,
            developedAt: entity.data.developedAt,
            liveUrl: entity.data.liveUrl,
            repoUrl: entity.data.repoUrl,
            tags: entity.data.tags,
            coverImage: coverImageId,
            gallery: galleryIds.length > 0 ? galleryIds : undefined,
          },
        });
        projectMap.set(entity.id, doc.id as string);
        slugToPayloadIdMap.set(entity.data.slug, doc.id as string);
        console.log(`Migrated project: ${entity.data.title}`);
      } catch (e) {
        console.error(`Failed to migrate project ${entity.data.title}:`, e);
      }
    }
  }
  console.log("Project Map Keys:", Array.from(projectMap.keys()));

  // 7. Localizations (DE)
  console.log("\n--- Migrating Localizations (DE) ---");

  // Helper to find Payload ID of the EN version
  const findEnPayloadId = (deEntityKey: string, map: Map<number, string>) => {
    const relatedKeys = getRel(deEntityKey, "localizations");
    console.log(
      `Debug findEnPayloadId for ${deEntityKey}: relatedKeys=${JSON.stringify(relatedKeys)}`
    );
    for (const key of relatedKeys) {
      const relatedEntity = entityMap.get(key);
      if (relatedEntity) {
        console.log(
          `  Checking related entity: ${key}, locale=${relatedEntity.data.locale}, id=${relatedEntity.id}`
        );
        if (relatedEntity.data.locale === "en") {
          const payloadId = map.get(relatedEntity.id);
          console.log(`    Found EN entity! Payload ID: ${payloadId}`);
          return payloadId;
        }
      }
    }
    return null;
  };

  // Categories DE
  for (const entity of categoryEntities) {
    if (entity.data.locale === "de") {
      const key = getKey(entity.type, entity.id);
      const payloadId = findEnPayloadId(key, skillCategoryMap);
      if (payloadId) {
        await payload.update({
          collection: "skill-categories",
          id: payloadId,
          locale: "de",
          data: { name: entity.data.name, order: entity.data.order },
        });
        console.log(`Localized category: ${entity.data.name}`);
      }
    }
  }

  // Skills DE
  for (const entity of skillEntities) {
    if (entity.data.locale === "de") {
      const key = getKey(entity.type, entity.id);
      const payloadId = findEnPayloadId(key, skillMap);
      if (payloadId) {
        // Resolve Category DE -> EN Payload ID
        const catKeys = getRel(key, "skill_category");
        let categoryId = null;
        if (catKeys.length > 0) {
          const enCatPayloadId = findEnPayloadId(catKeys[0], skillCategoryMap);
          if (enCatPayloadId) categoryId = enCatPayloadId;
        }

        await payload.update({
          collection: "skills",
          id: payloadId,
          locale: "de",
          data: {
            name: entity.data.name,
            level: entity.data.level,
            iconClassName: entity.data.iconClassName,
            url: entity.data.url,
            skill_category: categoryId,
          },
        });
        console.log(`Localized skill: ${entity.data.name}`);
      }
    }
  }

  // Projects DE
  for (const entity of projectEntities) {
    if (entity.data.locale === "de") {
      const key = getKey(entity.type, entity.id);
      const payloadId = findEnPayloadId(key, projectMap);
      if (payloadId) {
        console.log(
          `Debug Localizing Project ${entity.data.title}: payloadId=${payloadId}`
        );

        const coverKeys = getRel(key, "coverImage");
        let coverImageId = null;
        if (coverKeys.length > 0) {
          const mediaId = getIdFromKey(coverKeys[0]);
          coverImageId = mediaMap.get(mediaId);
        }

        const galleryKeys = getRel(key, "gallery");
        const galleryIds = galleryKeys
          .map((k) => {
            const mid = getIdFromKey(k);
            return mediaMap.get(mid);
          })
          .filter(Boolean) as string[];

        try {
          const updated = await payload.update({
            collection: "software-projects",
            id: payloadId,
            locale: "de",
            data: {
              title: entity.data.title,
              slug: entity.data.slug,
              description: entity.data.description,
              longDescription: entity.data.longDescription,
              projectType: entity.data.projectType,
              developedAt: entity.data.developedAt,
              liveUrl: entity.data.liveUrl,
              repoUrl: entity.data.repoUrl,
              tags: entity.data.tags,
              coverImage: coverImageId,
              gallery: galleryIds.length > 0 ? galleryIds : undefined,
            },
          });
          console.log(
            `Localized project: ${updated.title} (Slug: ${updated.slug})`
          );
        } catch (e) {
          console.error(`Failed to localize project ${entity.data.title}:`, e);
        }
      } else {
        console.log(
          `Debug Localizing Project ${entity.data.title}: No payloadId found!`
        );
      }
    }
  }

  console.log("Migration completed!");
  process.exit(0);
}

migrate().catch(console.error);
