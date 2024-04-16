const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const treeKill = require('tree-kill');

let viteProcess;
let mainWindow;
let loadingWindow;
let wikiWindow;
let typeCalculatorProcess;
let typeCalculatorWindow;
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
    if (typeCalculatorWindow) {
      if (typeCalculatorWindow.isVisible()) {
        typeCalculatorWindow.hide();
      } else {
        typeCalculatorWindow.show();
      }
    } else {
      createTypeCalculatorWindow();
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

    // Close the type calculator window if it's open
    if (typeCalculatorWindow) {
      typeCalculatorWindow.close();
      typeCalculatorWindow = null;
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

  mainWindow.on('close', async (event) => {
    // Prevent the window from closing immediately
    event.preventDefault();

	// Close the type calculator Vite server if it's running
	if (typeCalculatorProcess) {
	  await new Promise((resolve) => {
		treeKill(typeCalculatorProcess.pid, 'SIGTERM', (err) => {
		  if (err) {
			console.error('Error killing type calculator Vite process:', err);
		  }
		  resolve();
		});
	  });
	  typeCalculatorProcess = null;
	}

	if (isOfflineMode && viteProcess) {
	  await new Promise((resolve) => {
		treeKill(viteProcess.pid, 'SIGTERM', (err) => {
		  if (err) {
			console.error('Error killing Vite process:', err);
		  }
		  resolve();
		});
	  });
	  viteProcess = null;
	}

	// Close the main window
	mainWindow.destroy();
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

function showTypeCalculatorErrorBox() {
  const errorWindow = new BrowserWindow({
    width: 400,
    height: 340,
    autoHideMenuBar: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  errorWindow.loadFile('error-type-calculator.html');
}

async function createTypeCalculatorWindow() {
  const typeCalculatorDir = path.join(__dirname, '..', 'app', 'type-calculator');
  if (!fs.existsSync(typeCalculatorDir)) {
    console.log('Type calculator files not found. Please run the update script to download the type calculator (located in the resources folder).');
    showTypeCalculatorErrorBox();
    return;
  }

  typeCalculatorLoadingWindow = new BrowserWindow({
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

  typeCalculatorLoadingWindow.loadFile('loading-type-calculator.html');
	
  typeCalculatorWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: 'icons/PR',
    show: false, // Hide the window initially
    webPreferences: {
      nodeIntegration: false
    }
  });

  const readyToStart = await startTypeCalculatorServer();

  typeCalculatorWindow.loadURL('http://localhost:5173');
  typeCalculatorWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => {
      typeCalculatorWindow.loadURL('http://localhost:5173');
    }, 1000);
  });

  typeCalculatorWindow.webContents.on('did-finish-load', () => {
    typeCalculatorWindow.show(); // Show the window when the content is loaded
    if (typeCalculatorLoadingWindow) {
      typeCalculatorLoadingWindow.close();
      typeCalculatorLoadingWindow = null;
    }
  });

  typeCalculatorWindow.on('close', (event) => {
    if (typeCalculatorProcess) {
      event.preventDefault();
      typeCalculatorWindow.hide(); // Hide the window instead of closing it
    }
  });
}

function startTypeCalculatorServer() {
  const typeCalculatorDir = path.join(__dirname, '..', 'app', 'type-calculator');

  typeCalculatorProcess = spawn('npm', ['run', 'start'], {
    cwd: typeCalculatorDir,
    shell: true,
    stdio: 'ignore'
  });

  return Promise.resolve(1);
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

ipcMain.on('close-type-calculator-loading-screen', () => {
  if (typeCalculatorLoadingWindow) {
    typeCalculatorLoadingWindow.close();
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