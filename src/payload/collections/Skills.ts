import type { CollectionConfig } from 'payload'

export const Skills: CollectionConfig = {
  slug: 'skills',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'iconClassName',
      type: 'text',
      localized: true,
    },
    {
      name: 'level',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      localized: true,
    },
    {
      name: 'url',
      type: 'text',
      localized: true,
    },
    {
      name: 'skill_category',
      type: 'relationship',
      relationTo: 'skill-categories',
    },
    {
      name: 'svgIcon',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
