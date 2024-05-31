import type { AstroIntegration } from "astro";
import {
  getAllPosts,
  downloadImage,
  downloadPublicImage,
  getAllBlocksByBlockId,
  getBlock,
} from "../lib/notion/client";
import { extractTargetBlocks } from "../lib/blog-helpers";
import type { Database } from "../lib/notion-interfaces";

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
        setTimeout(resolve, 1000 - (Date.now() - startTime))
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

      // Download cover image of posts
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

          let slug!: string;
          try {
            slug = post.Slug;
          } catch (error) {
            console.log("Could not find post slug\n" + error);
            return Promise.resolve();
          }

          // Add the download task to the queue
          downloadQueue.push(async () => {
            await downloadImage(url, slug);
            await downloadPublicImage(url, slug);
          });
        })
      );

      // Download blocks content
      await Promise.all(
        posts.map(async (post) => {
          let slug!: string;
          try {
            slug = post.Slug;
          } catch (error) {
            console.log("Could not find post slug\n" + error);
            return Promise.resolve();
          }

          const blocks = await getAllBlocksByBlockId(post.PageId);
          // console.log("\n===== Checking blocks =====");
          // console.dir(blocks);
          const fileAtacchedBlocks = extractTargetBlocks("image", blocks)
            .concat(extractTargetBlocks("file", blocks))
            .filter((block) => {
              // console.log("\n===== Checking fileAtacchedBlocks =====");
              // console.dir(block);
              if (!block) {
                return false;
              }
              const imageOrFile = block.Image || block.File;
              return imageOrFile && imageOrFile.File && imageOrFile.File.Url;
            });

          // console.log("\n===== Checking fileAtacchedBlocks =====");
          // console.dir(fileAtacchedBlocks);

          await Promise.all(
            fileAtacchedBlocks
              .map(async (block) => {
                const expiryTime = (block.Image || block.File)!.File!
                  .ExpiryTime;
                if (Date.parse(expiryTime!) > Date.now()) {
                  return Promise.resolve(block);
                }
                return getBlock(block.Id);
              })
              .map((promise) =>
                promise.then((block) => {
                  let url!: URL;
                  // console.log(
                  //   "\n===== Checking files after expiryTime part ====="
                  // );
                  // console.dir(block);
                  try {
                    url = new URL((block.Image || block.File)!.File!.Url);
                  } catch (err) {
                    console.log("Invalid file URL");
                    return Promise.reject();
                  }
                  return Promise.resolve({
                    url,
                    type: block.Image ? "image" : "file",
                  });
                })
              )
              .map((promise) =>
                promise.then(({ url, type }) => {
                  if (type === "image") {
                    // Add the download task to the queue
                    downloadQueue.push(async () => {
                      await downloadImage(url, slug);
                    });
                  }
                })
              )
          );
        })
      );

      // Process any remaining tasks in the queue
      await processQueue();
    },
  },
});
