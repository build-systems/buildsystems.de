const fs = require("fs");
const path = require("path");

const renames = [
  ["frame", "section-container"],
  ["content", "rich-text-container"],
  ["sticky", "sticky-section-header"],
  ["primary-font-size", "text-hero-heading"],
  ["primary-height", "min-h-hero"],
  ["primary-margin-top", "mt-hero"],
  ["msg-secondary", "text-subheading"],
  ["msg-tertiary", "text-body-large"],
  ["blend", "mix-blend-difference"],
  ["green", "text-brand-green"],
];

function replaceClasses(content) {
  let newContent = content;

  // 1. Replace inside `class="..."` or `className="..."`
  newContent = newContent.replace(
    /class(?:Name)?=["']([^"']+)["']/g,
    (match, classes) => {
      let replacedClasses = classes;
      for (const [oldClass, newClass] of renames) {
        // Split to ensure exact matches without replacing substrings inside larger class names
        const parts = replacedClasses.split(/\s+/);
        replacedClasses = parts
          .map((p) => (p === oldClass ? newClass : p))
          .join(" ");
      }
      // Return with original quote type and attribute
      const attrMatch = match.match(/class(?:Name)?=["']/);
      const quote = match.slice(-1);
      return `${attrMatch[0]}${replacedClasses}${quote}`;
    },
  );

  // 2. Replace css declarations like `.frame {` or `& .frame`
  for (const [oldClass, newClass] of renames) {
    const classCSSRegex = new RegExp(`\\.${oldClass}(?=[\\s{:,])`, "g");
    newContent = newContent.replace(classCSSRegex, `.${newClass}`);
  }

  return newContent;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    // Ignore node_modules, dist, .git
    if (file === "node_modules" || file === "dist" || file === ".git") continue;

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (
      file.endsWith(".astro") ||
      file.endsWith(".css") ||
      file.endsWith(".ts") ||
      file.endsWith(".tsx")
    ) {
      const originalContent = fs.readFileSync(fullPath, "utf8");
      const updatedContent = replaceClasses(originalContent);

      if (originalContent !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent);
        console.log("Updated:", fullPath);
      }
    }
  }
}

// Ensure the directory targets 'src' specifically so we don't accidentally update config files or build artifacts
processDirectory(path.join(process.cwd(), "src"));
