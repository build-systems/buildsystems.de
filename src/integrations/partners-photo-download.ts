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
            console.log("No photo URL found for partner: " + org.Name);
            return Promise.resolve();
          }

          let url!: URL;

          console.log("Downloading photo for partner: " + org.Name);
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
