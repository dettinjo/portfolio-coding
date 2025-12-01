import { getPayload } from "payload";
import configPromise from "@payload-config";

const check = async () => {
  const payload = await getPayload({ config: configPromise });

  console.log("Checking Skill Categories...");
  const categories = await payload.find({
    collection: "skill-categories",
    depth: 1,
    locale: "en",
  });

  categories.docs.forEach((cat) => {
    console.log(`Category: ${cat.name}`);
    if (cat.skills && Array.isArray(cat.skills)) {
      console.log(`  Skills count: ${cat.skills.length}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cat.skills.forEach((s: any) => {
        // If depth=1, s should be the skill object
        // If depth=0, s would be ID
        console.log(`  - ${typeof s === "object" ? s.name : s}`);
      });
    } else {
      console.log("  No skills linked.");
    }
  });

  console.log("\nChecking specific skills for icons...");
  const targetSkills = ["Transformers", "LLM", "spaCy", "spacy"]; // Added lowercase just in case
  const skills = await payload.find({
    collection: "skills",
    where: {
      name: { in: targetSkills },
    },
    depth: 1,
  });

  skills.docs.forEach((skill) => {
    console.log(`Skill: ${skill.name}`);
    console.log(`  Icon Class: ${skill.iconClassName}`);
    console.log(`  SVG Icon:`, skill.svgIcon);
  });

  process.exit(0);
};

check();
