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
  console.log('  ccms                           Interactive model selector');
  console.log('  ccms <model>                   Use specified model for all types');
  console.log('  ccms --multi                   Multi-select: choose model for each type');
  console.log('  ccms --opus <model>            Set Opus model only');
  console.log('  ccms --sonnet <model>          Set Sonnet model only');
  console.log('  ccms --haiku <model>           Set Haiku model only');
  console.log('  ccms --model <model>           Set default model only');
  console.log('  ccms --version                 Show version information');
  console.log('  ccms --help                    Show this help message');
  console.log('');
  console.log('\x1b[1mEXAMPLES\x1b[0m');
  console.log('  ccms                           # Interactive selection (all models same)');
  console.log('  ccms qwen3.5-plus              # Use qwen3.5-plus for all models');
  console.log('  ccms --multi                   # Choose different model for each type');
  console.log('  ccms --opus gpt-4 --sonnet gpt-3.5-turbo  # Set specific models');
  console.log('');
  console.log('\x1b[1mENVIRONMENT VARIABLES\x1b[0m');
  console.log('  ANTHROPIC_MODEL                Default model');
  console.log('  ANTHROPIC_DEFAULT_OPUS_MODEL   Opus model');
  console.log('  ANTHROPIC_DEFAULT_SONNET_MODEL Sonnet model');
  console.log('  ANTHROPIC_DEFAULT_HAIKU_MODEL  Haiku model');
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

// Check for --multi flag
const isMultiMode = args.includes('--multi');

// Parse model arguments
function parseModelArgs(args) {
  const models = {
    default: null,
    opus: null,
    sonnet: null,
    haiku: null
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--multi') {
      // Skip --multi flag
      continue;
    } else if (arg === '--opus' && args[i + 1]) {
      models.opus = args[++i];
    } else if (arg === '--sonnet' && args[i + 1]) {
      models.sonnet = args[++i];
    } else if (arg === '--haiku' && args[i + 1]) {
      models.haiku = args[++i];
    } else if (arg === '--model' && args[i + 1]) {
      models.default = args[++i];
    } else if (!arg.startsWith('-')) {
      // Positional argument - use for all models
      models.default = arg;
      models.opus = arg;
      models.sonnet = arg;
      models.haiku = arg;
    }
  }
  
  return models;
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
      authType: supplier.authType || 'ANTHROPIC_API_KEY'
    });
  }
}

// Parse command line model arguments (excluding --multi)
const cmdModels = parseModelArgs(args);

// If models specified via command line (not --multi), use them directly
if (!isMultiMode && (cmdModels.default || cmdModels.opus || cmdModels.sonnet || cmdModels.haiku)) {
  // Find supplier for the specified model
  const firstModel = cmdModels.default || cmdModels.opus || cmdModels.sonnet || cmdModels.haiku;
  let supplier = null;
  
  for (const s of config.suppliers || []) {
    if (s.models && s.models.includes(firstModel)) {
      supplier = s;
      break;
    }
  }
  
  if (!supplier) {
    // Use first supplier as default
    supplier = (config.suppliers && config.suppliers[0]) || null;
  }
  
  if (!supplier) {
    console.error('\x1b[31mError: No supplier configuration found\x1b[0m');
    process.exit(1);
  }
  
  console.log('');
  if (cmdModels.default && !cmdModels.opus && !cmdModels.sonnet && !cmdModels.haiku) {
    console.log(`\x1b[32mModel: ${cmdModels.default}\x1b[0m`);
  } else {
    if (cmdModels.default) console.log(`\x1b[32mDefault: ${cmdModels.default}\x1b[0m`);
    if (cmdModels.opus) console.log(`\x1b[32mOpus: ${cmdModels.opus}\x1b[0m`);
    if (cmdModels.sonnet) console.log(`\x1b[32mSonnet: ${cmdModels.sonnet}\x1b[0m`);
    if (cmdModels.haiku) console.log(`\x1b[32mHaiku: ${cmdModels.haiku}\x1b[0m`);
  }
  console.log('\x1b[33mStarting Claude Code...\x1b[0m');
  console.log('');
  
  // Set environment variables
  const env = {
    ...process.env,
    ANTHROPIC_BASE_URL: supplier.baseUrl
  };
  
  // Clear conflicting auth variables
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  
  // Set auth environment variable
  const authType = supplier.authType || 'ANTHROPIC_API_KEY';
  if (authType === 'ANTHROPIC_AUTH_TOKEN') {
    env.ANTHROPIC_AUTH_TOKEN = supplier.apiKey;
  } else {
    env.ANTHROPIC_API_KEY = supplier.apiKey;
  }
  
  // Set model variables
  if (cmdModels.default) {
    env.ANTHROPIC_MODEL = cmdModels.default;
  }
  if (cmdModels.opus) {
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = cmdModels.opus;
  }
  if (cmdModels.sonnet) {
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = cmdModels.sonnet;
  }
  if (cmdModels.haiku) {
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = cmdModels.haiku;
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
  
  return;
}

// Interactive mode
if (modelList.length === 0) {
  console.error('\x1b[31mError: No models found in configuration\x1b[0m');
  process.exit(1);
}

// Interactive menu state
let selectedIndex = 0;
let selectedModels = {
  default: null,
  opus: null,
  sonnet: null,
  haiku: null
};
let currentSelecting = 0; // 0: default, 1: opus, 2: sonnet, 3: haiku

const modelTypes = [
  { key: 'default', label: 'Default Model', envVar: 'ANTHROPIC_MODEL' },
  { key: 'opus', label: 'Opus Model', envVar: 'ANTHROPIC_DEFAULT_OPUS_MODEL' },
  { key: 'sonnet', label: 'Sonnet Model', envVar: 'ANTHROPIC_DEFAULT_SONNET_MODEL' },
  { key: 'haiku', label: 'Haiku Model', envVar: 'ANTHROPIC_DEFAULT_HAIKU_MODEL' }
];

function drawMenu(multiStep = false) {
  // Clear screen and move cursor to top
  process.stdout.write('\x1b[2J\x1b[H');
  
  if (multiStep) {
    // Multi-select mode header
    console.log('');
    console.log(`\x1b[1m\x1b[36m  Selecting: ${modelTypes[currentSelecting].label}\x1b[0m`);
    console.log(`\x1b[90m  ${modelTypes[currentSelecting].envVar}\x1b[0m`);
    console.log('');
    
    // Show already selected models
    if (currentSelecting > 0) {
      console.log('\x1b[90m  Already selected:\x1b[0m');
      for (let i = 0; i < currentSelecting; i++) {
        const type = modelTypes[i];
        const model = selectedModels[type.key];
        console.log(`\x1b[90m    ${type.label}: \x1b[37m${model}\x1b[0m`);
      }
      console.log('');
    }
  } else {
    console.log('');
  }
  
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
  
  drawMenu(isMultiMode);
  
  process.stdin.on('data', (key) => {
    // Handle key input
    if (key === '\x1B[A' || key === 'k') { // Up arrow or k
      selectedIndex = (selectedIndex - 1 + modelList.length) % modelList.length;
      drawMenu(isMultiMode);
    } else if (key === '\x1B[B' || key === 'j') { // Down arrow or j
      selectedIndex = (selectedIndex + 1) % modelList.length;
      drawMenu(isMultiMode);
    } else if (key === '\r' || key === '\n') { // Enter
      if (isMultiMode) {
        selectMultiModel();
      } else {
        selectModel();
      }
    } else if (key === '\x1B') { // Escape
      console.log('\x1b[33mCancelled\x1b[0m');
      process.exit(0);
    } else if (key === '\x03') { // Ctrl+C
      process.exit(0);
    }
  });
}

function selectMultiModel() {
  const selected = modelList[selectedIndex];
  selectedModels[modelTypes[currentSelecting].key] = selected.model;
  
  currentSelecting++;
  selectedIndex = 0;
  
  if (currentSelecting >= modelTypes.length) {
    // All models selected, launch Claude
    launchWithModels(selectedModels);
  } else {
    drawMenu(true);
  }
}

function selectModel() {
  const selected = modelList[selectedIndex];
  
  // In single mode, set all models to the same value
  selectedModels.default = selected.model;
  selectedModels.opus = selected.model;
  selectedModels.sonnet = selected.model;
  selectedModels.haiku = selected.model;
  
  launchWithModels(selectedModels);
}

function launchWithModels(models) {
  const selected = modelList[selectedIndex];
  
  console.log('');
  console.log('\x1b[32mSelected models:\x1b[0m');
  console.log(`  Default: ${models.default}`);
  console.log(`  Opus:    ${models.opus}`);
  console.log(`  Sonnet:  ${models.sonnet}`);
  console.log(`  Haiku:   ${models.haiku}`);
  console.log('');
  console.log('\x1b[33mStarting Claude Code...\x1b[0m');
  console.log('');
  
  // Restore terminal
  process.stdin.setRawMode(false);
  process.stdin.pause();
  
  // Find the supplier for the first model (use its baseUrl and apiKey)
  let supplier = null;
  for (const s of config.suppliers || []) {
    if (s.models && s.models.includes(models.default)) {
      supplier = s;
      break;
    }
  }
  
  if (!supplier) {
    supplier = (config.suppliers && config.suppliers[0]) || null;
  }
  
  if (!supplier) {
    console.error('\x1b[31mError: No supplier configuration found\x1b[0m');
    process.exit(1);
  }
  
  // Set environment variables
  const env = {
    ...process.env,
    ANTHROPIC_BASE_URL: supplier.baseUrl
  };
  
  // Clear conflicting auth variables
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  
  // Set auth environment variable
  const authType = supplier.authType || 'ANTHROPIC_API_KEY';
  if (authType === 'ANTHROPIC_AUTH_TOKEN') {
    env.ANTHROPIC_AUTH_TOKEN = supplier.apiKey;
  } else {
    env.ANTHROPIC_API_KEY = supplier.apiKey;
  }
  
  // Set all model variables
  env.ANTHROPIC_MODEL = models.default;
  env.ANTHROPIC_DEFAULT_OPUS_MODEL = models.opus;
  env.ANTHROPIC_DEFAULT_SONNET_MODEL = models.sonnet;
  env.ANTHROPIC_DEFAULT_HAIKU_MODEL = models.haiku;
  
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

// Start interactive mode
startInteractive();