import { defineConfig } from "astro/config";
import { CUSTOM_DOMAIN, BASE_PATH } from "./src/server-constants";
import DatabaseCoverImageDownloader from "./src/integrations/db-cover-image-downloader";
import CoverImagesDownloader from "./src/integrations/cover-images-downloader";
// import CustomIconDownloader from "./src/integrations/custom-icon-downloader";
import PublicImageDownloader from "./src/integrations/public-images-downloader";
import PublicNotionCopier from "./src/integrations/public-notion-copier";

import lottie from "astro-integration-lottie";
import sitemap from "@astrojs/sitemap";

const getSite = function () {
  if (CUSTOM_DOMAIN) {
    return new URL(BASE_PATH, `https://${CUSTOM_DOMAIN}`).toString();
  }

  if (process.env.VERCEL && process.env.VERCEL_URL) {
    return new URL(BASE_PATH, `https://${process.env.VERCEL_URL}`).toString();
  }

  if (process.env.CF_PAGES) {
    if (process.env.CF_PAGES_BRANCH !== "main") {
      return new URL(BASE_PATH, process.env.CF_PAGES_URL).toString();
    }

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
  integrations: [
    lottie(),
    sitemap(),
    DatabaseCoverImageDownloader(),
    CoverImagesDownloader(),
    // CustomIconDownloader(),
    PublicImageDownloader(),
    // PublicNotionCopier(),
  ],
  prefetch: true,
});
