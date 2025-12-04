import config from "../../payload.config";
import { getPayload } from "payload";

async function checkIds() {
  const payload = await getPayload({ config });
  const categories = await payload.find({
    collection: "skill-categories",
    limit: 100,
  });
  console.log(
    "Skill Categories IDs:",
    categories.docs.map((d) => d.id)
  );
  process.exit(0);
}

checkIds();
