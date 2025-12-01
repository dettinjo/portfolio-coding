import { getPayload } from "payload";
import configPromise from "@payload-config";

const check = async () => {
  const payload = await getPayload({ config: configPromise });

  const slug = "automated-it-infrastructure-recovery-with-terraform";
  console.log(`Checking project: ${slug}`);

  // Check EN
  const enDocs = await payload.find({
    collection: "software-projects",
    where: { slug: { equals: slug } },
    locale: "en",
    depth: 1,
  });

  if (enDocs.docs.length > 0) {
    const doc = enDocs.docs[0];
    console.log("Found EN doc:", doc.id);
    console.log("Title:", doc.title);
    console.log("Slug:", doc.slug);
    console.log("CoverImage:", doc.coverImage);
    if (doc.coverImage)
      console.log(
        "CoverImage Details:",
        JSON.stringify(doc.coverImage, null, 2)
      );
  } else {
    console.log("EN doc not found");
  }

  // List all DE projects
  console.log("Listing all DE projects:");
  const allDeDocs = await payload.find({
    collection: "software-projects",
    locale: "de",
    depth: 0,
    limit: 100,
  });

  allDeDocs.docs.forEach((d) => {
    console.log(`- ${d.title} (Slug: ${d.slug})`);
  });

  // Check DE specific
  const deSlug =
    "automatisierte-wiederherstellung-der-it-infrastruktur-mit-terraform";
  const deDocs = await payload.find({
    collection: "software-projects",
    where: { slug: { equals: deSlug } },
    locale: "de",
    depth: 1,
  });

  if (deDocs.docs.length > 0) {
    const doc = deDocs.docs[0];
    console.log("Found DE doc:", doc.id);
    console.log("Title:", doc.title);
    console.log("Slug:", doc.slug);
    console.log("CoverImage:", doc.coverImage);
    console.log("Localizations:", JSON.stringify(doc.localizations, null, 2));
  } else {
    console.log("DE doc not found");
  }

  process.exit(0);
};

check();
