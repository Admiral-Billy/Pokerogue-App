const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const treeKill = require('tree-kill');

let viteProcess;
let mainWindow;
let loadingWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 749,
    autoHideMenuBar: true,
    icon: 'icons/PR',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      persistSessionStorage: true,
      persistUserDataDirName: 'Pokerogue'
    }
  });

  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    autoHideMenuBar: true,
    resizable: false,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  loadingWindow.loadFile('loading.html');

  const readyToStart = await startServer();

  mainWindow.loadURL('http://localhost:8000');
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:8000');
    }, 1000);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    const gameWidth = 1280;
    const gameHeight = 750;
    mainWindow.setSize(gameWidth, gameHeight);
    mainWindow.center();
    mainWindow.show();
    loadingWindow.close();
  });

  mainWindow.on('close', (event) => {
    if (viteProcess) {
      event.preventDefault();
      treeKill(viteProcess.pid, 'SIGTERM', (err) => {
        if (err) {
          console.error('Error killing Vite process:', err);
        }
        mainWindow.destroy();
      });
    }
  });
}

function startServer() {
  const gameDir = path.join(__dirname, '..', 'app', 'game');
  if (!fs.existsSync(gameDir)) {
    console.log('Game files not found. Please run the update script to download the game (located in the resources folder).');
    showErrorBox();
    return;
  }

  viteProcess = spawn('npm', ['run', 'start'], {
    cwd: gameDir,
    shell: true,
    stdio: 'ignore'
  });

  return Promise.resolve(1);
}

function showErrorBox() {
  const errorWindow = new BrowserWindow({
    width: 400,
    height: 300,
    autoHideMenuBar: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  errorWindow.loadFile('error.html');
  errorWindow.on('closed', () => {
    app.quit();
  });
}

ipcMain.on('close-loading-screen', () => {
  if (loadingWindow) {
    loadingWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});