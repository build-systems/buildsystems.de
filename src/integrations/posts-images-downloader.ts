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

          return downloadFile(url), downloadPublicImage(url);
        })
      );

      await Promise.all(
        posts.map(async (post) => {
          const blocks = await getAllBlocksByBlockId(post.PageId);

          const imageAtacchedBlocks = extractTargetBlocks(
            "image",
            blocks
          ).filter((block) => {
            if (!block) {
              return false;
            }
            const imageBlock = block.Image;
            return imageBlock && imageBlock.File && imageBlock.File.Url;
          });

          await Promise.all(
            imageAtacchedBlocks
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
                  try {
                    url = new URL((block.Image || block.File)!.File!.Url);
                  } catch (err) {
                    console.log("Invalid file URL");
                    return Promise.reject();
                  }
                  return Promise.resolve(url);
                })
              )
              .map((promise) => promise.then(downloadFile))
          );
        })
      );
    },
  },
});
