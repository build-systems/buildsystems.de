import { defineConfig } from "astro/config";
import { CUSTOM_DOMAIN, BASE_PATH } from "./src/server-constants";
import IndexPostImageDownloader from "./src/integrations/index-posts-cover-image-downloader";
import PostsFilesDownloader from "./src/integrations/posts-files-downloader";
import PeoplePhotoDownloader from "./src/integrations/people-photo-download";
import OrganizationsPhotoDownloader from "./src/integrations/organizations-photo-download.ts";
import PartnersPhotoDownloader from "./src/integrations/partners-photo-download.ts";
import tailwindcss from "@tailwindcss/vite";

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
        .join(".")}`,
    ).toString();
  }

  return new URL(BASE_PATH, "http://localhost:4321").toString();
};

export default defineConfig({
  site: getSite(),
  base: BASE_PATH,
  server: {
    port: 4321,
    host: true,
  },
  redirects: {
    "/personen": "/team",
    "/about": "/team",
    "/services": "/leistungen",
    "/ourwork": "/portfolio",
    "/ourwork/[...slug]": "/portfolio/[...slug]",
  },
  integrations: [
    lottie(),
    sitemap(),
    IndexPostImageDownloader(),
    PostsFilesDownloader(),
    PeoplePhotoDownloader(),
    OrganizationsPhotoDownloader(),
    PartnersPhotoDownloader(),
  ],
  prefetch: true,
  vite: {
    plugins: [tailwindcss()],
  },
});
