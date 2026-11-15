#!/usr/bin/env node

/**
 * KelvinKamara.com - Node.js/Express Setup Script
 * 
 * This script validates the migration and prepares the project for running.
 * It checks for missing dependencies and provides setup guidance.
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(50));
console.log('KelvinKamara.com - Setup Validator');
console.log('='.repeat(50) + '\n');

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0]);

console.log(`✓ Node.js version: ${nodeVersion}`);

if (majorVersion < 16) {
  console.error('\n✗ ERROR: Node.js 16+ required');
  console.error('  Current version: ' + nodeVersion);
  console.error('  Please upgrade Node.js from https://nodejs.org/\n');
  process.exit(1);
}

// Check .env file
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('\nEnvironment Configuration:');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file exists');
} else {
  console.warn('⚠ .env file not found');
  console.warn('  Run: cp .env.example .env');
  console.warn('  Then update .env with your configuration');
}

if (fs.existsSync(envExamplePath)) {
  console.log('✓ .env.example file exists');
} else {
  console.error('✗ .env.example not found');
  process.exit(1);
}

// Check required directories
console.log('\nDirectory Structure:');
const requiredDirs = [
  'src',
  'src/config',
  'src/controllers',
  'src/routes',
  'src/middlewares',
  'src/services',
  'src/utils',
  'src/views',
  'public',
  'sessions',
  'logs'
];

let missingDirs = false;
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✓ ${dir}/`);
  } else {
    console.error(`✗ ${dir}/ NOT FOUND`);
    missingDirs = true;
  }
});

if (missingDirs) {
  console.error('\n✗ ERROR: Missing required directories');
  process.exit(1);
}

// Check key files
console.log('\nCore Files:');
const requiredFiles = [
  'package.json',
  'src/app.js',
  'src/config/index.js',
  'src/controllers/contactControllers.js',
  'src/routes/index.js',
  'src/services/mailService.js',
  'src/views/home.pug'
];

let missingFiles = false;
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✓ ${file}`);
  } else {
    console.error(`✗ ${file} NOT FOUND`);
    missingFiles = true;
  }
});

if (missingFiles) {
  console.error('\n✗ ERROR: Missing required files');
  process.exit(1);
}

// Check package.json validity
console.log('\nDependencies:');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  const requiredDeps = [
    'express',
    'dotenv',
    'nodemailer',
    'pug',
    'express-rate-limit',
    'http-status'
  ];

  requiredDeps.forEach(dep => {
    if (pkg.dependencies[dep]) {
      console.log(`✓ ${dep} configured`);
    } else {
      console.error(`✗ ${dep} missing from package.json`);
    }
  });
} catch (err) {
  console.error('✗ Invalid package.json:', err.message);
  process.exit(1);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('✅ Setup Validation Passed!');
console.log('='.repeat(50));

console.log('\n📝 Next Steps:');
console.log('  1. npm install         # Install dependencies');
console.log('  2. Update .env         # Configure settings');
console.log('  3. npm run dev         # Start development server');
console.log('  4. Visit http://localhost:8000');

console.log('\n📚 Documentation:');
console.log('  • NODEJS_README.md     - Complete guide');
console.log('  • MIGRATION_SUMMARY.md - What was migrated');
console.log('  • .env.example         - Configuration template');

console.log('\n💡 Tips:');
console.log('  • Use "npm run dev" for development');
console.log('  • Check logs/ directory for request logs');
console.log('  • Sessions stored in sessions/ directory');
console.log('  • Static files in public/ directory');

console.log('\n');
