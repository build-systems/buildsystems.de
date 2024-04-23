import type { AstroIntegration } from "astro";
import {
  getAllPosts,
  downloadFile,
  downloadPublicImage,
  getAllBlocksByBlockId,
  getBlock,
} from "../lib/notion/client";
import { extractTargetBlocks } from "../lib/blog-helpers";

export default (): AstroIntegration => ({
  name: "posts-image-downloader",
  hooks: {
    "astro:build:start": async () => {
      const posts = await getAllPosts();

      // Download cover images
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

          return downloadFile(url, slug), downloadPublicImage(url, slug);
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
                    return downloadFile(url, slug);
                  }
                  // else {
                  //   return downloadPublicImage(url, slug);
                  // }
                })
              )
          );
        })
      );
    },
  },
});
