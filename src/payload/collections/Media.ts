import type { CollectionConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, "../../../public/media"),
    // Accept common raster formats + SVG (SVGs bypass the sharp pipeline automatically)
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/avif",
      "image/tiff",
      "image/svg+xml",
    ],
    // Auto-convert every raster upload to WebP (SVG is not resizable so it bypasses this)
    formatOptions: {
      format: "webp",
      options: { quality: 85 },
    },
    // Prevent runaway file sizes: cap at 2400px on the longest edge
    resizeOptions: {
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    },
  },
};
