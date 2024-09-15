const fs = require('fs');
const https = require('https');
const path = require('path');
const {
  app,
  Menu,
} = require('electron');
const globals = require("./globals");

const { getTabData: getAboutTabData } = require("./about_tab");
const { getTabData: getSettingsTabData} = require("./settings_tab");
const { getTabData: getUtilitiesTabData} = require("./utilities_tab");
const { getTabData: getFileTabData } = require("./file_tab");

function createWindow(opts) {
  const { BrowserWindow } = require('electron');
  opts = opts ?? {};
  const preloadPath = path.join(__dirname, 'utils_preload.js');
  console.log("preloadPath: %O", preloadPath);
  const defaultOpts = {
    icon: 'icons/PR',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true
    }
  };
  opts = {...defaultOpts, ...opts};
  const win = new BrowserWindow(opts);
  if(opts.enableDeveloperConsole === true)
    win.webContents.toggleDevTools();
  return win;
}

function createPopup(opts, content) {
  opts = opts ?? {};
  const window = createWindow({
    width: 300,
    height: 150,
    autoHideMenuBar: true,
    minimizable: false,
    maximizable: false,
    resizable: false,
    parent: undefined,
    modal: true,
    alwaysOnTop: true,
    ...opts
  });
  if(content)
    window.loadURL(`data:text/html,${encodeURIComponent(content)}`);
  return window;
}

function fetchCurrentAppVersionInfo() {
  return new Promise((resolve, _reject) => {
    resolve(app.getVersion())
  });
}

function fetchLatestAppVersionInfo(opts) {
  opts = opts ?? {};
  const options = {
    headers: {
      'User-Agent': 'Pokerogue-App',
    },
    ...opts
  }
  return new Promise((resolve, reject) => {
    https.get(globals.latestAppReleaseUrl, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          resolve(JSON.parse(data))
        }
        catch (error) {
          console.error('Error parsing release data:', error);
          reject(new Error('Failed to parse the release data.'));
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching latest release:', error);
      reject(error);
    });
  });
}

function fetchCurrentGameVersionInfo() {
  return new Promise((resolve, reject) => {
    fs.readFile(globals.currentVersionPath, 'utf8', (err, data) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(data);
    })
  });
}

function fetchLatestGameVersionInfo(opts) {
  opts = opts ?? {};
  const options = {
    headers: {
      'User-Agent': 'Pokerogue-App',
    },
    ...opts
  }
  return new Promise((resolve, reject) => {
    https.get(globals.latestGameReleaseUrl, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          resolve(JSON.parse(data))
        }
        catch (error) {
          console.error('Error parsing release data:', error);
          reject(new Error('Failed to parse the release data.'));
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching latest release:', error);
      reject(error);
    });
  });
}

function saveSettings() {
  const userDataPath = app.getPath('userData');
  const settingsFilePath = path.join(userDataPath, 'settings.json');

  const settings = {
    closeUtilityWindows: globals.closeUtilityWindows,
    darkMode: globals.darkMode,
    windowSize: globals.mainWindow.getSize(),
    isFullScreen: globals.mainWindow.isFullScreen(),
    isMaximized: globals.mainWindow.isMaximized(),
    autoHideMenu: globals.autoHideMenu,
    hideCursor: globals.hideCursor,
    isMuted: globals.isMuted,
    isBeta: globals.isBeta,
    isOfflineMode: globals.isOfflineMode,
    isPRMLMode: globals.isPRMLMode
  };

  fs.writeFileSync(settingsFilePath, JSON.stringify(settings));
}

function loadSettings() {
  const userDataPath = app.getPath('userData');
  const settingsFilePath = path.join(userDataPath, 'settings.json');

  let useDefault = false;

  if (fs.existsSync(settingsFilePath)) {
    try {
      const settingsData = fs.readFileSync(settingsFilePath, 'utf-8');
      const settings = JSON.parse(settingsData);
      globals.closeUtilityWindows = settings.closeUtilityWindows;
      globals.darkMode = settings.darkMode;
      globals.autoHideMenu = settings.autoHideMenu;
      globals.hideCursor = settings.hideCursor;
	  globals.isBeta = settings.isBeta;
      globals.isOfflineMode = globals.gameFilesDownloaded ? settings.isOfflineMode : false;
      globals.isPRMLMode = settings.isPRMLMode || false

      // Set the window size, fullscreen state, and maximized state
      if (globals.onStart) {
        if (settings.windowSize) {
          globals.mainWindow.setSize(settings.windowSize[0], settings.windowSize[1]);
        }
        globals.mainWindow.center();
        if (settings.isFullScreen) {
          globals.mainWindow.setFullScreen(true);
        } else if (settings.isMaximized) {
          globals.mainWindow.maximize();
        }
      }

	  // Apply mutes
	  globals.isMuted = settings.isMuted;
	  if (globals.isMuted) {
		  globals.mainWindow.webContents.audioMuted = true;
	  }

      // Apply the auto-hide menu setting
      globals.mainWindow.setAutoHideMenuBar(globals.autoHideMenu);
      globals.mainWindow.setMenuBarVisibility(!globals.autoHideMenu);
    } catch (error) {
      console.log(`Error ${error}: Can't open settings file.`);
      useDefault = true;
    }
  }
  else {
    useDefault = true;
  }

  if (useDefault) {
    globals.closeUtilityWindows = false;
    globals.darkMode = false;
    globals.autoHideMenu = false;
    globals.hideCursor = false;
    globals.isMuted = false;
    globals.isBeta = false;
    globals.isOfflineMode = false;

    // Apply the auto-hide menu setting
    globals.mainWindow.setAutoHideMenuBar(globals.autoHideMenu);
    globals.mainWindow.setMenuBarVisibility(!globals.autoHideMenu);
  }
}

function resetGame() {
  if (globals.isOfflineMode) {
    globals.mainWindow.loadFile(path.join(globals.gameDir, 'index.html'));
  }
  else if (globals.isBeta) {
		 globals.mainWindow.loadURL('https://beta.pokerogue.net/');
  }
  else if(globals.isPRMLMode){
    globals.mainWindow.loadURL('https://mokerogue.net/')
  }
  else {
    globals.mainWindow.loadURL('https://pokerogue.net/');
  }

  globals.mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      loadSettings();
      updateMenu();
      applyDarkMode();
      applyCursorHide();

    }, 100);
  });
}

function downloadFile(url, outputPath, onBytesReceived, opts) {
  const fileStream = fs.createWriteStream(outputPath);
  let receivedBytes = 0;
  opts = opts ?? {};
  const downloadOptions = {
    ...globals.httpOptions,
    ...opts,
    timeout: 30000, // Set a timeout of 30 seconds
  };
  return new Promise((resolve, reject) => {
    https.get(url, downloadOptions, (response) => {
      if (response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, downloadOptions, (response) => {
          response.on('data', (chunk) => {
            receivedBytes += chunk.length;
            onBytesReceived(receivedBytes)
          });

          response.pipe(fileStream);
        });
      } else {
        response.on('data', (chunk) => {
          receivedBytes += chunk.length;
          onBytesReceived(receivedBytes)
        });

        response.pipe(fileStream);
      }

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(outputPath);
      });
    }).on('error', (error) => {
      console.error(`Error downloading ${url}: %O`, error);
      reject(error);
    });
  });
}

function updateMenu() {
  const tabs = [
    getFileTabData(),
    getSettingsTabData(),
    getUtilitiesTabData(),
    getAboutTabData()
  ];
  const menu = Menu.buildFromTemplate(tabs);
  Menu.setApplicationMenu(menu);
}

function applyDarkMode() {
  if (globals.darkMode) {
    globals.mainWindow.webContents.insertCSS(`
      #app {
        background: black;
      }
    `);
  } else {
    globals.mainWindow.webContents.insertCSS(`
      #app {
        background: #484050;
      }
    `);
  }
}

function applyCursorHide() {
  if (globals.hideCursor) {
    globals.mainWindow.webContents.insertCSS(`
      #app {
        cursor: none;
      }
    `);
  } else {
    globals.mainWindow.webContents.insertCSS(`
      #app {
        cursor: auto;
      }
    `);
  }
}

module.exports.createWindow = createWindow;
module.exports.createPopup = createPopup;
module.exports.fetchCurrentAppVersionInfo = fetchCurrentAppVersionInfo;
module.exports.fetchLatestAppVersionInfo = fetchLatestAppVersionInfo;
module.exports.fetchCurrentGameVersionInfo = fetchCurrentGameVersionInfo;
module.exports.fetchLatestGameVersionInfo = fetchLatestGameVersionInfo;
module.exports.saveSettings = saveSettings;
module.exports.loadSettings = loadSettings;
module.exports.resetGame = resetGame;
module.exports.downloadFile = downloadFile;
module.exports.updateMenu = updateMenu;
module.exports.applyDarkMode = applyDarkMode;
module.exports.applyCursorHide = applyCursorHide;