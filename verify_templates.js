const pug = require('pug');
const fs = require('fs');
const path = require('path');

// Get all .pug files
const viewsPath = path.join(__dirname, 'src', 'views');

function getAllPugFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(getAllPugFiles(fullPath));
    } else if (item.name.endsWith('.pug')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const pugFiles = getAllPugFiles(viewsPath);

console.log(`\nVerifying ${pugFiles.length} Pug template files...\n`);

let errors = 0;
let compiled = 0;

for (const file of pugFiles) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    // Just verify that Pug can parse it
    pug.compile(content, { filename: file });
    console.log(`✓ ${path.relative(viewsPath, file)}`);
    compiled++;
  } catch (err) {
    console.error(`✗ ${path.relative(viewsPath, file)}`);
    console.error(`  Error: ${err.message}`);
    errors++;
  }
}

console.log(`\n${compiled} templates compiled successfully`);
if (errors > 0) {
  console.log(`${errors} templates had errors`);
  process.exit(1);
} else {
  console.log('\nAll templates are valid!');
  process.exit(0);
}
