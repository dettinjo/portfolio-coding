import type { CollectionConfig } from 'payload'

export const SkillCategories: CollectionConfig = {
  slug: 'skill-categories',
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
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      localized: true,
    },
    {
      name: 'skills',
      type: 'relationship',
      relationTo: 'skills',
      hasMany: true,
    },
  ],
}
