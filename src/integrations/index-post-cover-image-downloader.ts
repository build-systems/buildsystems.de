import type { AstroIntegration } from "astro";
import {
  getDatabase,
  downloadFile,
  downloadPublicImage,
} from "../lib/notion/client";

export default (): AstroIntegration => ({
  name: "cover-image-downloader",
  hooks: {
    "astro:build:start": async () => {
      console.log("\nStarting downloading cover image");
      const database = await getDatabase();

      if (!database.Cover || database.Cover.Type !== "file") {
        console.log("\nNo cover found");
        return Promise.resolve();
      }

      let url!: URL;
      try {
        url = new URL(database.Cover.Url);
      } catch (err) {
        console.log("Invalid Cover image URL");
        return Promise.resolve();
      }
      console.log("\nDownloading cover image");
      return downloadFile(url), downloadPublicImage(url);
    },
  },
});
