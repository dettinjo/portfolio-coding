import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";

import { Users } from "./src/payload/collections/Users";
import { Media } from "./src/payload/collections/Media";
import { SoftwareProjects } from "./src/payload/collections/SoftwareProjects";
import { Skills } from "./src/payload/collections/Skills";
import { SkillCategories } from "./src/payload/collections/SkillCategories";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, "payload.importmap.ts"),
    },
    components: {
      views: {
        account: {
          Component: "@/payload/components/TwoFactorAuth#TwoFactorAuth",
        },
        login: {
          Component: "@/payload/components/Login#Login",
        },
      },
    },
  },
  collections: [Users, Media, SoftwareProjects, Skills, SkillCategories],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "super-secret-key",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: process.env.POSTGRES_URL
    ? postgresAdapter({
        pool: {
          connectionString: process.env.POSTGRES_URL,
        },
      })
    : sqliteAdapter({
        client: {
          url: process.env.DATABASE_URI || "file:./payload.db",
        },
      }),
  localization: {
    locales: ["en", "de"],
    defaultLocale: "en",
    fallback: true,
  },
  endpoints: [],
  sharp,
  plugins: [
    // storage-adapter-placeholder
  ],
});
