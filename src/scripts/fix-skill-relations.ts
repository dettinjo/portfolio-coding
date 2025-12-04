import { getPayload } from "payload";
import configPromise from "@payload-config";

const fixRelations = async () => {
  const payload = await getPayload({ config: configPromise });

  console.log("Fetching all skills...");
  const { docs: skills } = await payload.find({
    collection: "skills",
    limit: 1000,
    depth: 0, // We just need the ID and category ID
  });

  console.log(`Found ${skills.length} skills.`);

  const categoryMap: Record<string | number, (string | number)[]> = {};

  for (const skill of skills) {
    if (skill.skill_category) {
      const catId =
        typeof skill.skill_category === "object"
          ? skill.skill_category.id
          : skill.skill_category;

      if (!categoryMap[catId]) {
        categoryMap[catId] = [];
      }
      categoryMap[catId].push(skill.id);
    }
  }

  console.log("Updating categories...");
  for (const [catId, skillIds] of Object.entries(categoryMap)) {
    try {
      console.log(
        `Updating category ${catId} with ${skillIds.length} skills...`
      );
      await payload.update({
        collection: "skill-categories",
        id: catId,
        data: {
          skills: skillIds,
        },
      });
      console.log(`Updated category ${catId}`);
    } catch (error) {
      console.error(`Failed to update category ${catId}:`, error);
    }
  }

  console.log("Done!");
  process.exit(0);
};

fixRelations();
