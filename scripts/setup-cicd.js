#!/usr/bin/env node

/**
 * CI/CD Setup Script
 * Automates Vercel linking and GitHub secrets configuration
 *
 * Usage: npm run setup-cicd
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 CI/CD Setup Script');
  console.log('====================\n');

  // Check Vercel CLI
  log('Checking Vercel CLI...', colors.yellow);
  if (!exec('npx vercel --version')) {
    log('❌ Could not access Vercel CLI', colors.red);
    process.exit(1);
  }
  log('✅ Vercel CLI found\n', colors.green);

  // Check Vercel auth
  log('🔐 Checking Vercel authentication...', colors.yellow);
  const whoami = exec('npx vercel whoami');
  if (!whoami) {
    log('⚠️  Not logged in to Vercel', colors.yellow);
    log('Please run: npx vercel login\n');
    process.exit(1);
  }
  log(`✅ Logged in as ${whoami.trim()}\n`, colors.green);

  // Check if project is linked
  log('🔗 Checking Vercel project link...', colors.yellow);
  const projectPath = path.join(process.cwd(), '.vercel', 'project.json');

  if (!fs.existsSync(projectPath)) {
    log('⚠️  Project not linked', colors.yellow);
    log('Linking project...\n');

    try {
      execSync('npx vercel link --yes', { stdio: 'inherit' });
      log('\n✅ Project linked\n', colors.green);
    } catch (error) {
      log('❌ Failed to link project', colors.red);
      process.exit(1);
    }
  } else {
    log('✅ Project already linked\n', colors.green);
  }

  // Read credentials
  log('📋 Reading project credentials...', colors.yellow);
  let projectData;
  try {
    projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
  } catch (error) {
    log('❌ Could not read project.json', colors.red);
    process.exit(1);
  }

  const { projectId, orgId } = projectData;
  log('✅ Credentials found:', colors.green);
  log(`   Project ID: ${projectId}`);
  log(`   Org ID: ${orgId}\n`);

  // Check GitHub CLI
  const hasGH = exec('gh --version');
  const ghAuthed = hasGH && exec('gh auth status 2>&1');

  if (hasGH && ghAuthed) {
    log('✅ GitHub CLI found and authenticated\n', colors.green);

    const autoSetup = await question('Would you like to set GitHub secrets automatically? (y/n) ');

    if (autoSetup.toLowerCase() === 'y') {
      console.log('\n🔑 To set secrets automatically, we need your Vercel token.');
      console.log('   Get it from: https://vercel.com/account/tokens\n');

      const token = await question('Enter your Vercel token (or press Enter to skip): ');

      if (token.trim()) {
        const repo = exec('git config --get remote.origin.url')
          ?.replace(/.*github\.com[:/](.*?)\.git/, '$1')
          ?.trim();

        if (!repo) {
          log('❌ Could not determine GitHub repository', colors.red);
          process.exit(1);
        }

        log(`\n📤 Setting GitHub secrets for repository: ${repo}`, colors.yellow);

        try {
          execSync(`echo "${token}" | gh secret set VERCEL_TOKEN -R "${repo}"`, { stdio: 'inherit' });
          execSync(`echo "${projectId}" | gh secret set VERCEL_PROJECT_ID -R "${repo}"`, { stdio: 'inherit' });
          execSync(`echo "${orgId}" | gh secret set VERCEL_ORG_ID -R "${repo}"`, { stdio: 'inherit' });

          log('\n✅ GitHub secrets set successfully!\n', colors.green);
          log('🎉 CI/CD setup complete!\n', colors.green);
          log('Next steps:');
          log('  1. Push to dev branch: git push origin dev');
          log(`  2. View workflow: https://github.com/${repo}/actions\n`);

          rl.close();
          return;
        } catch (error) {
          log('❌ Failed to set GitHub secrets', colors.red);
          log('Falling back to manual setup...\n', colors.yellow);
        }
      }
    }
  }

  // Manual setup instructions
  const repo = exec('git config --get remote.origin.url')
    ?.replace(/.*github\.com[:/](.*?)\.git/, '$1')
    ?.trim() || 'YOUR_REPO';

  log('📝 Manual Setup Required\n', colors.yellow);
  log('Follow these steps to complete CI/CD setup:\n');
  log('1️⃣  Create a Vercel token:');
  log('   → https://vercel.com/account/tokens');
  log('   → Click \'Create Token\'');
  log('   → Name: \'GitHub Actions CI/CD\'');
  log('   → Copy the token\n');
  log('2️⃣  Add GitHub secrets:');
  log(`   → https://github.com/${repo}/settings/secrets/actions/new\n`);
  log('   Add these three secrets:\n');
  log(`   ${colors.green}VERCEL_TOKEN${colors.reset}`);
  log('   Value: [Paste your Vercel token]\n');
  log(`   ${colors.green}VERCEL_PROJECT_ID${colors.reset}`);
  log(`   Value: ${projectId}\n`);
  log(`   ${colors.green}VERCEL_ORG_ID${colors.reset}`);
  log(`   Value: ${orgId}\n`);
  log('3️⃣  Test the pipeline:');
  log('   git add .');
  log('   git commit -m "test: Verify CI/CD pipeline"');
  log('   git push origin dev\n');
  log('📊 Monitor deployments:');
  log(`   https://github.com/${repo}/actions\n`);

  rl.close();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, colors.red);
  process.exit(1);
});
