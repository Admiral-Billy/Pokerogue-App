const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const treeKill = require('tree-kill');

let viteProcess = null;
let mainWindow;
let loadingWindow;
let wikiWindow;
let smogonWindow;
let teamBuilderWindow;
let typeChartWindow;
let typeCalculatorProcess = null;
let typeCalculatorWindow = null;
let typeCalculatorLoadingWindow = null;
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

  // Initialize the ad blocker for the main window
  const mainWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  mainWindowBlocker.enableBlockingInSession(mainWindow.webContents.session);

  // Create a custom menu template
  const menuTemplate = [
    {
      label: 'Utilities',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CommandOrControl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Wiki',
          accelerator: 'CommandOrControl+W',
          click: () => {
            if (wikiWindow) {
              if (wikiWindow.isVisible()) {
                wikiWindow.hide();
                mainWindow.focus(); // Set focus to the main window
              } else {
                wikiWindow.show();
                wikiWindow.focus(); // Set focus to the wiki window
              }
            } else {
              createWikiWindow();
            }
          }
        },
        {
          label: 'Type Chart',
          accelerator: 'CommandOrControl+Y',
          click: () => {
            if (typeChartWindow) {
              if (typeChartWindow.isVisible()) {
                typeChartWindow.hide();
                mainWindow.focus(); // Set focus to the main window
              } else {
                typeChartWindow.show();
                typeChartWindow.focus(); // Set focus to the type chart window
              }
            } else {
              createTypeChartWindow();
            }
          }
        },
        {
          label: 'Type Calculator',
          accelerator: 'CommandOrControl+T',
          click: () => {
            if (typeCalculatorWindow) {
              if (typeCalculatorWindow.isVisible()) {
                typeCalculatorWindow.hide();
                mainWindow.focus(); // Set focus to the main window
              } else {
                typeCalculatorWindow.show();
                typeCalculatorWindow.focus(); // Set focus to the type calculator window
              }
            } else {
              createTypeCalculatorWindow();
            }
          }
        },
        {
          label: 'Team Builder',
          accelerator: 'CommandOrControl+B',
          click: () => {
            if (teamBuilderWindow) {
              if (teamBuilderWindow.isVisible()) {
                teamBuilderWindow.hide();
                mainWindow.focus(); // Set focus to the main window
              } else {
                teamBuilderWindow.show();
                teamBuilderWindow.focus(); // Set focus to the team builder window
              }
            } else {
              createTeamBuilderWindow();
            }
          }
        },
        {
          label: 'Smogon',
          accelerator: 'CommandOrControl+S',
          click: () => {
            if (smogonWindow) {
              if (smogonWindow.isVisible()) {
                smogonWindow.hide();
                mainWindow.focus(); // Set focus to the main window
              } else {
                smogonWindow.show();
                smogonWindow.focus(); // Set focus to the Smogon window
              }
            } else {
              createSmogonWindow();
            }
          }
        }
      ]
    }
  ];

  // Create the menu from the template
  const menu = Menu.buildFromTemplate(menuTemplate);

  // Set the custom menu as the application menu
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', async () => {
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

    // Close the team builder window if it's open
    if (teamBuilderWindow) {
      teamBuilderWindow.close();
      teamBuilderWindow = null;
    }

    // Close the Smogon window if it's open
    if (smogonWindow) {
      smogonWindow.close();
      smogonWindow = null;
    }

    // Close the type chart window if it's open
    if (typeChartWindow) {
      typeChartWindow.close();
      typeChartWindow = null;
    }
	
    // Terminate the type calculator process if it's running in offline mode
    if (typeCalculatorProcess) {
		process.kill(typeCalculatorProcess.pid);
		console.log("killed it");
    }

    // Terminate the Vite process if it's running in offline mode
    if (viteProcess) {
		process.kill(viteProcess.pid);
    }
	
	app.quit()
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

    startServer();
    mainWindow.loadURL('http://localhost:8000');
    mainWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:8000');
      }, 1000);
    });
  } else {
    mainWindow.loadURL('https://pokerogue.net/');
  }

  // Register the shortcuts for the main window
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
  typeCalculatorWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: 'icons/PR',
    show: false, // Hide the window initially
    webPreferences: {
      nodeIntegration: false
    }
  });

  if (!isOfflineMode) {
    // Initialize the ad blocker for the type calculator window
    const typeCalculatorWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    typeCalculatorWindowBlocker.enableBlockingInSession(typeCalculatorWindow.webContents.session);

    typeCalculatorWindow.loadURL('https://www.pkmn.help');
  } else {
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

    startTypeCalculatorServer();

    typeCalculatorWindow.loadURL('http://localhost:5173');
    typeCalculatorWindow.webContents.on('did-fail-load', () => {
      setTimeout(() => {
        typeCalculatorWindow.loadURL('http://localhost:5173');
      }, 1000);
    });
  }

  typeCalculatorWindow.webContents.on('did-finish-load', () => {
    typeCalculatorWindow.show(); // Show the window when the content is loaded
    typeCalculatorWindow.focus(); // Set focus to the type calculator window
    if (typeCalculatorLoadingWindow) {
      typeCalculatorLoadingWindow.close();
      typeCalculatorLoadingWindow = null;
    }
    typeCalculatorWindow.webContents.executeJavaScript(`
      const style = document.createElement('style');
      style.innerHTML = '\
        .navigation-buttons {\
          position: fixed;\
          top: 10px;\
          left: 10px;\
          z-index: 9999;\
        }\
        .navigation-button {\
          background-color: #333;\
          color: #fff;\
          border: none;\
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

      const homeButton = document.createElement('button');
      homeButton.className = 'navigation-button';
      homeButton.innerText = 'Home';
      homeButton.addEventListener('click', () => {
        window.location.href = 'https://www.pkmn.help';
      });
      buttonsContainer.appendChild(homeButton);

      document.body.appendChild(buttonsContainer);
    `);
  });

  typeCalculatorWindow.on('close', (event) => {
    if (typeCalculatorWindow) {
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
}

async function createWikiWindow() {
  wikiWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false
    }
  });

  // Initialize the ad blocker for the wiki window
  const wikiWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  wikiWindowBlocker.enableBlockingInSession(wikiWindow.webContents.session);

  wikiWindow.loadURL('https://wiki.pokerogue.net/');

  wikiWindow.on('close', (event) => {
    if (wikiWindow) {
      event.preventDefault();
      wikiWindow.hide(); // Hide the window instead of closing it
    }
  });

  // Enable back and forward navigation
  wikiWindow.webContents.on('did-finish-load', () => {
    wikiWindow.focus(); // Set focus to the wiki window
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
          background-color: #333;\
          color: #fff;\
          border: none;\
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
      buttons

Container.appendChild(forwardButton);

      const homeButton = document.createElement('button');
      homeButton.className = 'navigation-button';
      homeButton.innerText = 'Home';
      homeButton.addEventListener('click', () => {
        window.location.href = 'https://wiki.pokerogue.net/';
      });
      buttonsContainer.appendChild(homeButton);

      document.body.appendChild(buttonsContainer);
    `);
  });
}

function createTypeChartWindow() {
  typeChartWindow = new BrowserWindow({
    width: 670,
    height: 1000,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: true
    }
  });

  typeChartWindow.loadFile('type-chart.png');

  typeChartWindow.on('close', (event) => {
    if (typeChartWindow) {
      event.preventDefault();
      typeChartWindow.hide(); // Hide the window instead of closing it
    }
  });
}

async function createTeamBuilderWindow() {
  teamBuilderWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false
    }
  });

  // Initialize the ad blocker for the team builder window
  const teamBuilderWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  teamBuilderWindowBlocker.enableBlockingInSession(teamBuilderWindow.webContents.session);

  teamBuilderWindow.loadURL('https://marriland.com/tools/team-builder/');

  teamBuilderWindow.on('close', (event) => {
    if (teamBuilderWindow) {
      event.preventDefault();
      teamBuilderWindow.hide(); // Hide the window instead of closing it
    }
  });

  // Enable back and forward navigation
  teamBuilderWindow.webContents.on('did-finish-load', () => {
    teamBuilderWindow.focus(); // Set focus to the team builder window
    teamBuilderWindow.webContents.executeJavaScript(`
      const style = document.createElement('style');
      style.innerHTML = '\
        .navigation-buttons {\
          position: fixed;\
          top: 10px;\
          left: 10px;\
          z-index: 9999;\
        }\
        .navigation-button {\
          background-color: #333 !important;\
          color: #fff !important;\
          border: none !important;\
          border-radius: 4px !important;\
          padding: 6px 12px !important;\
          margin-right: 5px !important;\
          cursor: pointer !important;\
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

      const homeButton = document.createElement('button');
      homeButton.className = 'navigation-button';
      homeButton.innerText = 'Home';
      homeButton.addEventListener('click', () => {
        window.location.href = 'https://marriland.com/tools/team-builder/';
      });
      buttonsContainer.appendChild(homeButton);

      document.body.appendChild(buttonsContainer);
    `);
  });
}

async function createSmogonWindow() {
  smogonWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false
    }
  });

  // Initialize the ad blocker for the Smogon window
  const smogonWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  smogonWindowBlocker.enableBlockingInSession(smogonWindow.webContents.session);

  smogonWindow.loadURL('https://www.smogon.com/dex/sv/pokemon/');

  smogonWindow.on('close', (event) => {
    if (smogonWindow) {
      event.preventDefault();
      smogonWindow.hide(); // Hide the window instead of closing it
    }
  });
  
  smogonWindow.on('closed', async () => {
    smogonWindow = null;
  });

  // Enable back and forward navigation
  smogonWindow.webContents.on('did-finish-load', () => {
    smogonWindow.focus(); // Set focus to the Smogon window
    smogonWindow.webContents.executeJavaScript(`
      const style = document.createElement('style');
      style.innerHTML = '\
        .navigation-buttons {\
          position: fixed;\
          top: 10px;\
          left: 10px;\
          z-index: 9999;\
        }\
        .navigation-button {\
          background-color: #333 !important;\
          color: #fff !important;\
          border: none !important;\
          border-radius: 4px !important;\
          padding: 6px 12px !important;\
          margin-right: 5px !important;\
          cursor: pointer !important;\
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

      const homeButton = document.createElement('button');
      homeButton.className = 'navigation-button';
      homeButton.innerText = 'Home';
      homeButton.addEventListener('click', () => {
        window.location.href = 'https://www.smogon.com/dex/sv/pokemon/';
      });
      buttonsContainer.appendChild(homeButton);

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

app.on('window-all-closed', () => { app.quit(); });

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});