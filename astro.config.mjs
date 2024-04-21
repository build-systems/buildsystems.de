import { defineConfig } from "astro/config";
import { CUSTOM_DOMAIN, BASE_PATH } from "./src/server-constants";
import IndexPostImageDownloader from "./src/integrations/index-posts-cover-image-downloader";
import PostsImagesDownloader from "./src/integrations/posts-files-downloader";
import CustomIconDownloader from "./src/integrations/custom-icon-downloader";

import lottie from "astro-integration-lottie";
import sitemap from "@astrojs/sitemap";

const getSite = function () {
  if (CUSTOM_DOMAIN) {
    return new URL(BASE_PATH, `https://${CUSTOM_DOMAIN}`).toString();
  }

  if (process.env.CF_PAGES && CF_PAGES_BRANCH !== "main") {
    if (process.env.CF_PAGES_BRANCH !== "main") {
      return new URL(BASE_PATH, process.env.CF_PAGES_URL).toString();
    }

    // This one is only usefull if there's not proper registered domain
    // It is when the site is only on CF pages
    return new URL(
      BASE_PATH,
      `https://${new URL(process.env.CF_PAGES_URL).host
        .split(".")
        .slice(1)
        .join(".")}`
    ).toString();
  }

  return new URL(BASE_PATH, "http://localhost:4321").toString();
};

export default defineConfig({
  site: getSite(),
  base: BASE_PATH,
  redirects: {
    "/personen": "/team",
    "foerdertool/": "/toolbox",
  },
  integrations: [
    lottie(),
    sitemap(),
    IndexPostImageDownloader(),
    PostsImagesDownloader(),
    // CustomIconDownloader(),
  ],
  prefetch: true,
});
