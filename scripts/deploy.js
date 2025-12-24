#!/usr/bin/env node

/**
 * Manual Deployment Script
 * Executes CI/CD deployment process locally
 *
 * Usage:
 *   npm run deploy          # Deploy to preview
 *   npm run deploy:prod     # Deploy to production
 */

const { execSync, spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

function execLive(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [], { shell: true, stdio: 'inherit' });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const isProduction = process.argv.includes('--prod') || process.argv.includes('--production');

  console.log('');
  log('🚀 Manual Deployment Script', colors.cyan);
  log('==========================', colors.cyan);
  console.log('');

  // Get current branch
  const currentBranch = exec('git rev-parse --abbrev-ref HEAD')?.trim();
  log(`📍 Current branch: ${currentBranch}`, colors.blue);

  // Check for uncommitted changes
  const status = exec('git status --porcelain');
  if (status && status.trim()) {
    log('⚠️  Warning: You have uncommitted changes', colors.yellow);
    const proceed = await question('Continue anyway? (y/n) ');
    if (proceed.toLowerCase() !== 'y') {
      log('❌ Deployment cancelled', colors.red);
      rl.close();
      process.exit(0);
    }
  } else {
    log('✅ Working directory is clean', colors.green);
  }

  // Determine deployment type
  let deploymentType;
  if (isProduction) {
    deploymentType = 'production';
    log('\n🏭 Deploying to PRODUCTION', colors.yellow);

    if (currentBranch !== 'main') {
      log(`⚠️  Warning: You're on branch "${currentBranch}" but deploying to production`, colors.yellow);
      log('   Production deployments should typically be from "main" branch', colors.yellow);
      const proceed = await question('\nContinue with production deployment? (y/n) ');
      if (proceed.toLowerCase() !== 'y') {
        log('❌ Deployment cancelled', colors.red);
        rl.close();
        process.exit(0);
      }
    }
  } else {
    deploymentType = 'preview';
    log('\n🔍 Deploying to PREVIEW', colors.cyan);
  }

  // Step 1: Run linting
  console.log('');
  log('Step 1/3: Running ESLint...', colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  try {
    await execLive('npm run lint');
    log('✅ Linting passed', colors.green);
  } catch (error) {
    log('⚠️  Linting found issues, but continuing...', colors.yellow);
  }

  // Step 2: Build check (optional)
  console.log('');
  const runBuild = await question('Run build check before deployment? (y/n) ');
  if (runBuild.toLowerCase() === 'y') {
    log('\nStep 2/3: Running build...', colors.cyan);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
    try {
      await execLive('npm run build');
      log('✅ Build successful', colors.green);
    } catch (error) {
      log('❌ Build failed', colors.red);
      const proceed = await question('\nContinue with deployment anyway? (y/n) ');
      if (proceed.toLowerCase() !== 'y') {
        log('❌ Deployment cancelled', colors.red);
        rl.close();
        process.exit(1);
      }
    }
  }

  // Step 3: Deploy to Vercel
  console.log('');
  log(`Step 3/3: Deploying to Vercel (${deploymentType})...`, colors.cyan);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);

  try {
    const vercelCommand = isProduction
      ? 'npx vercel --prod --yes'
      : 'npx vercel --yes';

    await execLive(vercelCommand);

    console.log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.green);
    log('✅ Deployment successful!', colors.green);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.green);
    console.log('');

    if (isProduction) {
      log('🌐 Production URL: https://getclientflow.app', colors.cyan);
    } else {
      log('🔗 Preview URL shown above', colors.cyan);
    }

  } catch (error) {
    console.log('');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.red);
    log('❌ Deployment failed', colors.red);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.red);
    console.log('');
    log('Error:', colors.red);
    log(error.message, colors.red);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main().catch(error => {
  console.log('');
  log(`❌ Error: ${error.message}`, colors.red);
  rl.close();
  process.exit(1);
});
