#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

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
      apiKey: supplier.apiKey
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
  
  // Set environment variables
  const env = {
    ...process.env,
    ANTHROPIC_MODEL: selected.model,
    ANTHROPIC_BASE_URL: selected.baseUrl,
    ANTHROPIC_API_KEY: selected.apiKey
  };
  
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