#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// Read package.json for version
const packageJsonPath = path.join(__dirname, '..', 'package.json');
let packageJson = {};
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (e) {
  // Ignore error
}

const VERSION = packageJson.version || '1.0.0';

// Parse command line arguments
const args = process.argv.slice(2);

// Handle --version, -v
if (args.includes('--version') || args.includes('-v')) {
  console.log(`ccms v${VERSION}`);
  console.log('Claude Code Model Switcher');
  process.exit(0);
}

// Handle --help, -h
if (args.includes('--help') || args.includes('-h')) {
  console.log('');
  console.log(`\x1b[1mccms\x1b[0m - Claude Code Model Switcher v${VERSION}`);
  console.log('');
  console.log('\x1b[1mUSAGE\x1b[0m');
  console.log('  ccms              Start interactive model selector');
  console.log('  ccms --version    Show version information');
  console.log('  ccms --help       Show this help message');
  console.log('');
  console.log('\x1b[1mCONFIG\x1b[0m');
  console.log(`  Config file: ${path.join(os.homedir(), '.claude-model-launcher', 'config.json')}`);
  console.log('');
  console.log('\x1b[1mKEYS\x1b[0m');
  console.log('  ↑/↓  Select model');
  console.log('  Enter  Confirm and launch Claude Code');
  console.log('  Esc  Exit');
  console.log('');
  console.log('\x1b[1mAUTHOR\x1b[0m');
  console.log(`  ${packageJson.author || 'whereyan'}`);
  console.log('');
  console.log('\x1b[1mREPOSITORY\x1b[0m');
  console.log(`  ${packageJson.homepage || 'https://github.com/whereyan/claude-code-model-switcher'}`);
  console.log('');
  process.exit(0);
}

// Config directory in user home
const configDir = path.join(os.homedir(), '.claude-model-launcher');
const configPath = path.join(configDir, 'config.json');

// Create default config if not exists
if (!fs.existsSync(configPath)) {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  // Read default config from example file
  const exampleConfigPath = path.join(__dirname, '..', 'config.example.json');
  
  if (fs.existsSync(exampleConfigPath)) {
    fs.copyFileSync(exampleConfigPath, configPath);
  } else {
    const minimalConfig = {
      defaultSupplierId: "",
      suppliers: []
    };
    fs.writeFileSync(configPath, JSON.stringify(minimalConfig, null, 2), 'utf8');
  }
  
  console.log(`\x1b[32mCreated config file: ${configPath}\x1b[0m`);
  console.log('Please edit the config file to add your suppliers and API key.\n');
}

// Read config
let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
  console.error('\x1b[31mError: Failed to read config file\x1b[0m');
  console.error(err.message);
  process.exit(1);
}

// Build model list with supplier info
const modelList = [];
for (const supplier of config.suppliers || []) {
  for (const model of supplier.models || []) {
    modelList.push({
      model: model,
      supplier: supplier.label || supplier.id,
      baseUrl: supplier.baseUrl,
      apiKey: supplier.apiKey,
      authType: supplier.authType || 'ANTHROPIC_API_KEY' // Default to ANTHROPIC_API_KEY
    });
  }
}

if (modelList.length === 0) {
  console.error('\x1b[31mError: No models found in configuration\x1b[0m');
  process.exit(1);
}

// Interactive menu
let selectedIndex = 0;

function drawMenu() {
  // Clear screen and move cursor to top
  process.stdout.write('\x1b[2J\x1b[H');
  
  console.log('');
  console.log('\x1b[90m  Use arrow keys to select, Enter to confirm:\x1b[0m');
  console.log('');
  
  for (let i = 0; i < modelList.length; i++) {
    const item = modelList[i];
    const display = `${item.model} (${item.supplier})`;
    if (i === selectedIndex) {
      console.log(`\x1b[32m  > ${display}\x1b[0m`);
    } else {
      console.log(`    ${display}`);
    }
  }
  
  console.log('');
  console.log('\x1b[90m  Press Esc to exit\x1b[0m');
}

function startInteractive() {
  // Set stdin to raw mode for key capture
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  drawMenu();
  
  process.stdin.on('data', (key) => {
    // Handle key input
    if (key === '\x1B[A' || key === 'k') { // Up arrow or k
      selectedIndex = (selectedIndex - 1 + modelList.length) % modelList.length;
      drawMenu();
    } else if (key === '\x1B[B' || key === 'j') { // Down arrow or j
      selectedIndex = (selectedIndex + 1) % modelList.length;
      drawMenu();
    } else if (key === '\r' || key === '\n') { // Enter
      selectModel();
    } else if (key === '\x1B') { // Escape
      console.log('\x1b[33mCancelled\x1b[0m');
      process.exit(0);
    } else if (key === '\x03') { // Ctrl+C
      process.exit(0);
    }
  });
}

function selectModel() {
  const selected = modelList[selectedIndex];
  
  console.log('');
  console.log(`\x1b[32mSelected: ${selected.model} (${selected.supplier})\x1b[0m`);
  console.log('\x1b[33mStarting Claude Code...\x1b[0m');
  console.log('');
  
  // Restore terminal
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  // Set environment variables based on authType
  const env = {
    ...process.env,
    ANTHROPIC_MODEL: selected.model,
    ANTHROPIC_BASE_URL: selected.baseUrl
  };
  
  // Set auth environment variable based on authType
  const authType = selected.authType || 'ANTHROPIC_API_KEY';
  if (authType === 'ANTHROPIC_AUTH_TOKEN') {
    env.ANTHROPIC_AUTH_TOKEN = selected.apiKey;
  } else {
    env.ANTHROPIC_API_KEY = selected.apiKey;
  }
  
  // Spawn claude process
  const claude = spawn('claude', [], {
    stdio: 'inherit',
    env: env,
    shell: true
  });
  
  claude.on('exit', (code) => {
    process.exit(code || 0);
  });
  
  claude.on('error', (err) => {
    console.error('\x1b[31mFailed to start Claude Code:\x1b[0m', err.message);
    process.exit(1);
  });
}

// Start
startInteractive();