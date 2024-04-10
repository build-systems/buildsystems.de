import fs from "node:fs";
import { execSync } from "child_process";
import type { AstroIntegration } from "astro";

export default (): AstroIntegration => ({
  name: "public-notion-copier",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      // const outDir = new URL("notion", dir.href).pathname;
      const outDir = "notion";
      // console.log("dir.href is = " + dir.href);
      // console.log("outDir is = " + outDir.split(":/").slice(-1)[0]);
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
      }

      execSync(`cp -n -r public/notion/* ${outDir} || true`);
    },
  },
});
