import { fetchSoftwareProjectBySlug } from "@/lib/payload";

const debug = async () => {
  const slug = "automated-it-infrastructure-recovery-with-terraform";
  console.log(`Fetching project: ${slug} (EN)`);
  const enProject = await fetchSoftwareProjectBySlug(slug, "en");
  console.log("EN Project:", enProject ? enProject.title : "Not Found");
  console.log(
    "EN Localizations:",
    enProject ? JSON.stringify(enProject.localizations, null, 2) : "N/A"
  );

  const deSlug =
    "automatisierte-wiederherstellung-der-it-infrastruktur-mit-terraform";
  console.log(`Fetching project: ${deSlug} (DE)`);
  const deProject = await fetchSoftwareProjectBySlug(deSlug, "de");
  console.log("DE Project:", deProject ? deProject.title : "Not Found");
  console.log(
    "DE Localizations:",
    deProject ? JSON.stringify(deProject.localizations, null, 2) : "N/A"
  );

  process.exit(0);
};

debug();
