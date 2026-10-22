#!/usr/bin/env node

// Usage:
//   npm run generate-data          → generate JSON once
//   npm run generate-data:watch   → regenerate on .md changes (requires nodemon)
//   npm run dev                   → generate + serve (one-time)

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const glob = require("glob");
const { execSync } = require("child_process");

// Configuration
const CONTENT_TYPES = process.env.CONTENT_TYPES
  ? process.env.CONTENT_TYPES.split(" ")
  : ["Books", "Movies", "Series"];

const OUTPUT_DIR = "public";
const API_DIR = path.join(OUTPUT_DIR, "api");
const DATA_DIR = "src/_data";

console.log("🚀 Starting local build process...\n");

// Step 1: Generate JSON files from Markdown
function generateJsonFiles() {
  console.log("📝 Generating JSON files from Markdown...");

  const contentTypes = CONTENT_TYPES.map((name) => ({
    name: name,
    sourceDir: `src/${name}`,
  }));

  console.log(
    `Content types: ${contentTypes.map((ct) => ct.name).join(", ")}\n`,
  );

  // Create output directory if it doesn't exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Process markdown files
  function processMarkdownFiles(sourceDir, outputName) {
    const pattern = `${sourceDir}/*.md`;
    const markdownFiles = glob.sync(pattern);
    const results = [];

    console.log(
      `  Processing ${outputName}: Found ${markdownFiles.length} files in ${sourceDir}`,
    );

    markdownFiles.forEach((file) => {
      try {
        const content = fs.readFileSync(file, "utf8");
        const { data, content: markdownContent } = matter(content);

        const result = {
          filename: path.basename(file),
          path: file,
          slug: path.basename(file, ".md"),
          frontmatter: data,
        };

        // Optional: Include excerpt or full content if needed
        // result.content = markdownContent;
        // result.excerpt = markdownContent.split('\n').slice(0, 3).join('\n');

        results.push(result);
      } catch (error) {
        console.error(`  ❌ Error processing ${file}:`, error.message);
      }
    });

    return results;
  }

  // Process each content type
  contentTypes.forEach(({ name, sourceDir }) => {
    const results = processMarkdownFiles(sourceDir, name);
    const outputPath = path.join(DATA_DIR, `${name}.json`);

    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`  ✅ Generated ${outputPath} with ${results.length} entries`);
  });

  // Generate a combined index of all content types
  const combinedIndex = {};
  contentTypes.forEach(({ name }) => {
    const filePath = path.join(DATA_DIR, `${name}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      combinedIndex[name] = {
        count: data.length,
        items: data,
      };
    }
  });

  fs.writeFileSync(
    path.join(DATA_DIR, "index.json"),
    JSON.stringify(combinedIndex, null, 2),
  );
  console.log("  ✅ Generated combined index.json\n");
}

// Step 2: Build 11ty site
function build11tySite() {
  console.log("🏗️  Building 11ty site...");
  try {
    execSync("npx @11ty/eleventy", {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    console.log("✅ 11ty build completed\n");
  } catch (error) {
    console.error("❌ Error building 11ty site:", error.message);
    process.exit(1);
  }
}

// Step 3: Copy JSON files to public directory
function copyJsonFiles() {
  console.log("📂 Copying JSON files to public directory...");

  // Create API directory
  if (!fs.existsSync(API_DIR)) {
    fs.mkdirSync(API_DIR, { recursive: true });
  }

  // Copy all JSON files to API directory
  const jsonFiles = glob.sync(`${DATA_DIR}/*.json`);
  jsonFiles.forEach((jsonFile) => {
    const filename = path.basename(jsonFile);
    const destPath = path.join(API_DIR, filename);
    fs.copyFileSync(jsonFile, destPath);
    console.log(`  ✅ Copied ${filename} to public/api/`);
  });

  // Copy individual content type files to root level for backwards compatibility
  CONTENT_TYPES.forEach((contentType) => {
    const srcPath = path.join(DATA_DIR, `${contentType}.json`);
    if (fs.existsSync(srcPath)) {
      const destPath = path.join(OUTPUT_DIR, `${contentType}.json`);
      fs.copyFileSync(srcPath, destPath);
      console.log(`  ✅ Copied ${contentType}.json to root level`);
    } else {
      console.log(`  ⚠️  Warning: ${contentType}.json not found, skipping`);
    }
  });

  console.log("\n✅ All JSON files copied successfully\n");
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const generateOnly = args.includes("--generate-only");

  try {
    generateJsonFiles();

    if (generateOnly) {
      console.log("🎉 JSON generation completed (skip Eleventy build).\n");
      return;
    }

    build11tySite();
    copyJsonFiles();

    console.log("🎉 Build completed successfully!");
    console.log(`📁 Output directory: ${path.resolve(OUTPUT_DIR)}`);
  } catch (error) {
    console.error("❌ Build failed:", error.message);
    process.exit(1);
  }
}

// Run the script
main();
