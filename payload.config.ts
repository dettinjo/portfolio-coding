import { sqliteAdapter } from "@payloadcms/db-sqlite";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
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
  email: nodemailerAdapter({
    defaultFromAddress: "dettinger.joel@gmail.com",
    defaultFromName: "Joel Dettinger",
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "super-secret-key",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db:
    process.env.POSTGRES_URL ||
    (process.env.DATABASE_URI &&
      (process.env.DATABASE_URI.startsWith("postgres://") ||
        process.env.DATABASE_URI.startsWith("postgresql://")))
      ? postgresAdapter({
          pool: {
            connectionString:
              process.env.POSTGRES_URL || process.env.DATABASE_URI,
            connectionTimeoutMillis: 5000,
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
