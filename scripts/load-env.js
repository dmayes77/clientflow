/**
 * Load environment variables from .env.local
 * Used by other scripts to access env vars
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    console.warn('Warning: .env.local not found');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  let currentKey = null;
  let currentValue = '';

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Check if this is a new key=value line
    const match = line.match(/^([^=]+)=(.*)$/);

    if (match && !currentKey) {
      // Start of a new key-value pair
      currentKey = match[1].trim();
      currentValue = match[2];

      // Check if value is complete (no unclosed quotes)
      if (!currentValue.startsWith('"') || currentValue.endsWith('"')) {
        process.env[currentKey] = currentValue.replace(/^"(.*)"$/, '$1');
        currentKey = null;
        currentValue = '';
      }
    } else if (currentKey) {
      // Continuation of multi-line value
      currentValue += '\n' + line;

      // Check if we've reached the end of the value
      if (line.endsWith('"')) {
        process.env[currentKey] = currentValue.replace(/^"(.*)"$/, '$1');
        currentKey = null;
        currentValue = '';
      }
    }
  }
}

loadEnv();
