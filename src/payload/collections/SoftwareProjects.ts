import type { CollectionConfig } from "payload";

export const SoftwareProjects: CollectionConfig = {
  slug: "software-projects",
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      required: true,
      localized: true,
    },
    {
      name: "longDescription",
      type: "textarea",
      localized: true,
    },
    {
      name: "projectType",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "developedAt",
      type: "date",
      localized: true,
    },
    {
      name: "liveUrl",
      type: "text",
      localized: true,
    },
    {
      name: "repoUrl",
      type: "text",
      localized: true,
    },
    {
      name: "tags",
      type: "json",
      localized: true,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      localized: true,
    },
    {
      name: "gallery",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      localized: true,
    },
  ],
};
