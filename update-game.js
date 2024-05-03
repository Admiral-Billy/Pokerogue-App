const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

function updateGameFiles() {
  const gameDir = path.join(__dirname, 'app', 'game');

  if (fs.existsSync(gameDir)) {
    fs.rmdirSync(gameDir, { recursive: true });
  }

  fs.mkdirSync(path.join(__dirname, 'app'), { recursive: true });

  execSync('git clone https://github.com/pagefaultgames/pokerogue.git game', {
    cwd: path.join(__dirname, 'app'),
    env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
  });
  console.log('Installing files, please wait...');
  execSync('npm install --silent', { cwd: gameDir });

  console.log('Game files updated successfully.');
}

async function updateTypeCalculator() {
  const typeCalculatorDir = path.join(__dirname, 'app', 'type-calculator');

  if (fs.existsSync(typeCalculatorDir)) {
    fs.rmdirSync(typeCalculatorDir, { recursive: true });
  }

  fs.mkdirSync(path.join(__dirname, 'app'), { recursive: true });

  execSync('git clone https://github.com/wavebeem/pkmn.help.git type-calculator', {
    cwd: path.join(__dirname, 'app'),
    env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
  });
  console.log('Installing files, please wait...');
  execSync('npm install --silent', { cwd: typeCalculatorDir });

  console.log('Type calculator updated successfully.');
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    function askQuestion() {
      rl.question(question, (answer) => {
        const lowercaseAnswer = answer.toLowerCase();
        if (lowercaseAnswer === 'y' || lowercaseAnswer === 'n') {
          rl.close();
          resolve(lowercaseAnswer === 'y');
        } else {
          console.log('Invalid input. Please enter "y" or "n".');
          askQuestion();
        }
      });
    }

    askQuestion();
  });
}

async function runUpdates() {
  const updateGame = await promptUser('Do you want to install/update PokeRogue locally for offline play? (y/n, takes up about 1.5gb of space): ');
  if (updateGame) {
    console.log('Downloading files, please wait...');
    updateGameFiles();
  }

  const updateCalculator = await promptUser('Do you want to install/update the CTRL+T ingame type calculator for offline play? (y/n, takes up about 1.9gb of space): ');
  if (updateCalculator) {
    console.log('Downloading files, please wait...');
    updateTypeCalculator();
  }
}

runUpdates();