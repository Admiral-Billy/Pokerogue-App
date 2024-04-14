const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function updateGameFiles() {
  const gameDir = path.join(__dirname, 'app', 'game');

  if (fs.existsSync(gameDir)) {
    fs.rmdirSync(gameDir, { recursive: true });
  }

  fs.mkdirSync(path.join(__dirname, 'app'), { recursive: true });

  execSync('git clone https://github.com/pagefaultgames/pokerogue.git game', { cwd: path.join(__dirname, 'app') });
  execSync('npm install', { cwd: gameDir });

  console.log('Game files updated successfully.');
}

updateGameFiles();