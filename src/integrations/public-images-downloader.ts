import type { AstroIntegration } from "astro";
import { getAllPosts, downloadPublicImage } from "../lib/notion/client";

export default (): AstroIntegration => ({
  name: "cover-image-downloader",
  hooks: {
    "astro:build:start": async () => {
      const posts = await getAllPosts();

      await Promise.all(
        posts.map((post) => {
          if (!post.Cover || !post.Cover.Url) {
            return Promise.resolve();
          }

          let url!: URL;
          try {
            url = new URL(post.Cover.Url);
          } catch (error) {
            console.log("Invalid cover image URL\n" + error);
            return Promise.resolve();
          }

          return downloadPublicImage(url);
        })
      );
    },
  },
});
