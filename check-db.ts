import { getPayload } from "payload";
import configPromise from "./payload.config";

const checkImages = async () => {
  const payload = await getPayload({ config: configPromise });

  const collections = [
    "software-projects",
    "users",
    "media",
    "skills",
    "skill-categories",
  ];

  for (const collection of collections) {
    try {
      const { docs } = await payload.find({
        collection: collection as any,
        limit: 1000,
        depth: 5,
      });

      console.log(`Checking collection: ${collection}`);
      const json = JSON.stringify(docs);
      if (json.includes("localhost:1337")) {
        console.error(`FOUND localhost:1337 in collection ${collection}!`);
        // Find specific docs
        for (const doc of docs) {
          if (JSON.stringify(doc).includes("localhost:1337")) {
            console.log("Doc ID:", doc.id);
            console.log(
              "Content snippet:",
              JSON.stringify(doc).substring(0, 200)
            );
          }
        }
      } else {
        console.log(`No localhost:1337 found in ${collection}`);
      }
    } catch (e) {
      console.log(
        `Skipping collection ${collection} (might not exist or error)`
      );
    }
  }

  process.exit(0);
};

checkImages();
