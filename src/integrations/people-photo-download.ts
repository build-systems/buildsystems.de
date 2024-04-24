import type { AstroIntegration } from "astro";
import { downloadFile, getAllPeople } from "../lib/notion/client";

export default (): AstroIntegration => ({
  name: "people-photo-downloader",
  hooks: {
    "astro:build:start": async () => {
      const people = await getAllPeople();

      // Download cover image of posts
      await Promise.all(
        people.map((person) => {
          if (!person.Photo || !person.Photo.Url) {
            return Promise.resolve();
          }

          let url!: URL;
          try {
            url = new URL(person.Photo.Url);
          } catch (error) {
            console.log("Invalid cover image URL\n" + error);
            return Promise.resolve();
          }

          return downloadFile(url, "");
        })
      );
    },
  },
});
