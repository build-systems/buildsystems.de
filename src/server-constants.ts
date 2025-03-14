// At the moment these keys are not being properly imported during dev or build.
// I am manually typing  "export PARTNERS_DB_ID=XXX" in terminal where node will run

export const NOTION_API_SECRET =
  import.meta.env.NOTION_API_SECRET || process.env.NOTION_API_SECRET || "";
export const DATABASE_ID =
  import.meta.env.DATABASE_ID || process.env.DATABASE_ID || "";
export const PEOPLE_DB_ID =
  import.meta.env.PEOPLE_DB_ID || process.env.PEOPLE_DB_ID || "";
export const ORGANIZATIONS_DB_ID =
  import.meta.env.ORGANIZATIONS_DB_ID || process.env.ORGANIZATIONS_DB_ID || "";
export const PARTNERS_DB_ID =
  import.meta.env.PARTNERS_DB_ID || process.env.PARTNERS_DB_ID || "";

export const CUSTOM_DOMAIN =
  import.meta.env.CUSTOM_DOMAIN ||
  process.env.CUSTOM_DOMAIN ||
  "buildsystems.de"; // <- Set your custom domain if you have. e.g. alpacat.com
export const BASE_PATH =
  import.meta.env.BASE_PATH || process.env.BASE_PATH || ""; // <- Set sub directory path if you want. e.g. /docs/

export const REQUEST_TIMEOUT_MS = parseInt(
  import.meta.env.REQUEST_TIMEOUT_MS || "10000",
  10,
);

export const NUMBER_OF_POSTS_PER_PAGE = 10;

export const ENABLE_LIGHTBOX = import.meta.env.ENABLE_LIGHTBOX;
