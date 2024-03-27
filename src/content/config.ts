import { defineCollection, z } from "astro:content";

export const collections = {
  blog: defineCollection({
    type: "content",
    schema: ({ image }) => z.object({
      title: z.string(),
      description: z.string(),
      author: z.string(),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      cover: image(),
      coverPublic: z.string(),
      coverAlt: z.string(),
      category: z.string(),
      tags: z.array(z.string()),
    }),
  }),
};
