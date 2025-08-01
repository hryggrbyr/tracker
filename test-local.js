const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const glob = require('glob');

console.log('Testing frontmatter extraction...');

// Install dependencies first: npm install gray-matter glob

const markdownFiles = glob.sync('src/books/*.md');
console.log(`Found ${markdownFiles.length} markdown files:`, markdownFiles);

const results = [];

markdownFiles.forEach(file => {
  console.log(`Processing: ${file}`);
  try {
    const content = fs.readFileSync(file, 'utf8');
    const { data, content: markdownContent } = matter(content);
    
    console.log(`  Frontmatter:`, data);
    
    results.push({
      filename: path.basename(file),
      path: file,
      frontmatter: data
    });
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

// Create output directory
if (!fs.existsSync('test-output')) {
  fs.mkdirSync('test-output');
}

fs.writeFileSync('src/_data/frontmatter.json', JSON.stringify(results, null, 2));
fs.writeFileSync('public/frontmatter.json', JSON.stringify(results, null, 2));
console.log(`\nGenerated JSON with ${results.length} entries`);
console.log('Output saved to: test-output/frontmatter.json');

// Show the JSON structure
console.log('\nGenerated JSON structure:');
console.log(JSON.stringify(results, null, 2));