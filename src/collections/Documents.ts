import { HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      type: 'text',
      name: 'name',
    },
    {
      type: 'ui',
      name: 'ai-document-outline-generator',
      admin: {
        components: {
          Field: '@/components/AiDocumentOutlineGenerator',
        },
        disableListColumn: true,
      },
    },
    {
      type: 'richText',
      name: 'content',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5', 'h6'] }),
        ],
      }),
      admin: {
        disableListColumn: true,
      },
    },
  ],
}
