const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const treeKill = require('tree-kill');

let viteProcess;
let mainWindow;
let loadingWindow;
let imageWindow;
let wikiWindow;
let isOfflineMode = process.argv.includes('--offline');

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

  // Register a global shortcut for CTRL+T
  globalShortcut.register('CommandOrControl+T', () => {
    if (imageWindow) {
      imageWindow.close();
      imageWindow = null;
    } else {
      createImageWindow();
    }
  });

  // Register a global shortcut for CTRL+W
  globalShortcut.register('CommandOrControl+W', () => {
    if (wikiWindow) {
      wikiWindow.close();
      wikiWindow = null;
    } else {
      createWikiWindow();
    }
  });

  mainWindow.on('closed', () => {
    // Unregister the global shortcuts when the main window is closed
    globalShortcut.unregisterAll();

    // Close the image window if it's open
    if (imageWindow) {
      imageWindow.close();
      imageWindow = null;
    }

    // Close the wiki window if it's open
    if (wikiWindow) {
      wikiWindow.close();
      wikiWindow = null;
    }
  });

  if (isOfflineMode) {
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

    mainWindow.on('close', (event) => {
      if (viteProcess) {
        console.log("server kill");
        event.preventDefault();
        treeKill(viteProcess.pid, 'SIGTERM', (err) => {
          mainWindow.destroy();
          if (err) {
            console.error('Error killing Vite process:', err);
          }
        });
      }
    });
  } else {
    mainWindow.loadURL('https://pokerogue.net/');
  }

  mainWindow.webContents.on('did-finish-load', () => {
    const gameWidth = 1280;
    const gameHeight = 750;
    mainWindow.setSize(gameWidth, 749);
    mainWindow.setSize(gameWidth, gameHeight);
    mainWindow.show();
    if (loadingWindow) {
      loadingWindow.close();
      loadingWindow = null;
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

function createImageWindow() {
  imageWindow = new BrowserWindow({
    width: 1322,
    height: 890,
    autoHideMenuBar: true,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false
    }
  });

  imageWindow.loadFile('type-chart.png');

  imageWindow.on('closed', () => {
    imageWindow = null;
  });

  // Remove the window frame
  imageWindow.setMenu(null);
}

function createWikiWindow() {
  wikiWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false
    }
  });

  wikiWindow.loadURL('https://wiki.pokerogue.net/');

  wikiWindow.on('closed', () => {
    wikiWindow = null;
  });

  // Enable back and forward navigation
  wikiWindow.webContents.on('did-finish-load', () => {
    wikiWindow.webContents.executeJavaScript(`
      const style = document.createElement('style');
      style.innerHTML = '\
        .navigation-buttons {\
          position: fixed;\
          top: 10px;\
          left: 10px;\
          z-index: 9999;\
        }\
        .navigation-button {\
          background-color: #fff;\
          border: 1px solid #ccc;\
          border-radius: 4px;\
          padding: 6px 12px;\
          margin-right: 5px;\
          cursor: pointer;\
        }\
      ';
      document.head.appendChild(style);

      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'navigation-buttons';

      const backButton = document.createElement('button');
      backButton.className = 'navigation-button';
      backButton.innerText = 'Back';
      backButton.addEventListener('click', () => {
        window.history.back();
      });
      buttonsContainer.appendChild(backButton);

      const forwardButton = document.createElement('button');
      forwardButton.className = 'navigation-button';
      forwardButton.innerText = 'Forward';
      forwardButton.addEventListener('click', () => {
        window.history.forward();
      });
      buttonsContainer.appendChild(forwardButton);

      document.body.appendChild(buttonsContainer);
    `);
  });
}

ipcMain.on('close-loading-screen', () => {
  if (loadingWindow) {
    loadingWindow.close();
  }
});

app.whenReady().then(() => {
  if (process.argv.includes('--offline')) {
    isOfflineMode = true;
  }
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