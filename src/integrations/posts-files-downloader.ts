import type { AstroIntegration } from "astro";
import {
  getAllPosts,
  downloadImage,
  downloadPublicImage,
  getAllBlocksByBlockId,
  getBlock,
} from "../lib/notion/client";
import {
  addSlugToName,
  extractTargetBlocks,
  returnImageNameAsJpg,
} from "../lib/blog-helpers";
import type { Database } from "../lib/notion-interfaces";
import fs from "fs";
import path from "path";

// https://developers.notion.com/reference/request-limits
// This is not working yet, re-do the processQueue
// First it is not really working with time
// Secondly if file already exists, it should not count
const MAX_REQUESTS_PER_SECOND = 3;

const downloadQueue: any[] = [];

// Function to process the queue
const processQueue = async () => {
  while (downloadQueue.length > 0) {
    const startTime = Date.now();
    const tasks = [];

    for (let i = 0; i < downloadQueue.length; i++) {
      const timeSinceStart = Date.now() - startTime;
      if (timeSinceStart < 1000 && tasks.length < MAX_REQUESTS_PER_SECOND) {
        tasks.push(downloadQueue.shift()());
      } else {
        break;
      }
    }

    // Wait until remaining time in the second elapses (if any)
    if (tasks.length > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 - (Date.now() - startTime)),
      );
    }

    // Execute tasks concurrently
    await Promise.all(tasks);
  }
};

export default (): AstroIntegration => ({
  name: "posts-files-downloader",
  hooks: {
    "astro:build:start": async () => {
      const posts = await getAllPosts();
      const slugs = posts.map((post) => post.Slug);
      // Clean up unused folders in public/notion and src/assets/notion
      const cleanDirs = [
        path.join("public", "notion"),
        path.join("src", "assets", "notion"),
      ];
      for (const dir of cleanDirs) {
        if (fs.existsSync(dir)) {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            // Never delete people, organizations, or partners folders
            if (
              entry.isDirectory() &&
              !slugs.includes(entry.name) &&
              !["people", "organizations", "partners"].includes(entry.name)
            ) {
              const fullPath = path.join(dir, entry.name);
              fs.rmSync(fullPath, { recursive: true, force: true });
              console.log(`Deleted unused folder: ${fullPath}`);
            }
          }
        }
      }
      // Download cover image and blocks content for each post
      await Promise.all(
        posts.map(async (post) => {
          const slug = post.Slug;
          const postDir = path.join("public", "notion", slug);
          // Collect post data
          const postData = { ...post };
          // Cover image
          let coverAsset = null;
          if (post.Cover && post.Cover.Url) {
            let url;
            try {
              url = new URL(post.Cover.Url);
            } catch (error) {
              url = null;
            }
            if (url) {
              const fileName = returnImageNameAsJpg(url);
              coverAsset = fileName;
              await downloadImage(url, slug);
              await downloadPublicImage(url, slug);
            }
          }
          // Block images/files
          const blocks = await getAllBlocksByBlockId(post.PageId);
          const fileAtacchedBlocks = extractTargetBlocks("image", blocks)
            .concat(extractTargetBlocks("file", blocks))
            .filter((block) => {
              const imageOrFile = block.Image || block.File;
              return imageOrFile && imageOrFile.File && imageOrFile.File.Url;
            });
          const blockAssets = [];
          for (const block of fileAtacchedBlocks) {
            let url: URL | null = null;
            const imageOrFile = block.Image || block.File;
            if (imageOrFile && imageOrFile.File && imageOrFile.File.Url) {
              try {
                url = new URL(imageOrFile.File.Url);
              } catch (err) {
                url = null;
              }
            }
            if (!url) {
              continue;
            }
            const fileName = returnImageNameAsJpg(url);
            blockAssets.push(fileName);
            await downloadImage(url, slug);
            await downloadPublicImage(url, slug);
          }
          // Ensure postDir exists
          if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir, { recursive: true });
          }
          // Write post.json
          const postJson = {
            ...postData,
            coverAsset,
            blockAssets,
            blocks,
          };
          fs.writeFileSync(
            path.join(postDir, "post.json"),
            JSON.stringify(postJson, null, 2),
          );
        }),
      );
    },
  },
});
