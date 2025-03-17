import type { AstroIntegration } from "astro";
import { downloadImage, getAllPartners } from "../lib/notion/client";

export default (): AstroIntegration => ({
  name: "people-photo-downloader",
  hooks: {
    "astro:build:start": async () => {
      const partners = await getAllPartners();

      // Download cover image of posts
      await Promise.all(
        partners.map((org) => {
          if (!org.Photo || !org.Photo.Url) {
            return Promise.resolve();
          }

          let url!: URL;
          try {
            url = new URL(org.Photo.Url);
          } catch (error) {
            console.log("Invalid cover image URL\n" + error);
            return Promise.resolve();
          }

          return downloadImage(url, "");
        }),
      );
    },
  },
});
