import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import rehypeExternalLinks from 'rehype-external-links';
import lottie from "astro-integration-lottie";
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://buildsystems.de',
  integrations: [mdx(), lottie(), sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'nord'
    },
    remarkPlugins: [remarkGfm, remarkSmartypants],
    rehypePlugins: [[rehypeExternalLinks, {
      target: '_blank'
    }]]
  },
  image: {
    domains: ["astro.build"],
  }
});