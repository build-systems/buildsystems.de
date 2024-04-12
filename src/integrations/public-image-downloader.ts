import type { AstroIntegration } from "astro";
import { getAllPosts, downloadPublicFile } from "../lib/notion/client";

export default (): AstroIntegration => ({
  name: "featured-image-downloader",
  hooks: {
    "astro:build:start": async () => {
      const posts = await getAllPosts();

      await Promise.all(
        posts.map((post) => {
          if (!post.PublicImage || !post.PublicImage.Url) {
            return Promise.resolve();
          }

          let url!: URL;
          try {
            url = new URL(post.PublicImage.Url);
          } catch (error) {
            console.log("Invalid PublicImage URL\n" + error);
            return Promise.resolve();
          }

          return downloadPublicFile(url);
        })
      );
    },
  },
});
