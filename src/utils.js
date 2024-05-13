const fs = require('fs');
const https = require('https');
const path = require('path');
const {
    app,
    Menu,
    BrowserWindow,
    globalShortcut
} = require('electron');
const globals = require("./globals");

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
        parent: globals.mainWindow,
        modal: true,
        alwaysOnTop: true,
        ...opts
    });
    if(content)
        window.loadURL(`data:text/html,${encodeURIComponent(content)}`);
    return window;
}

function fetchCurrentAppVersionInfo() {
    return new Promise((resolve, reject) => {
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
        useModifiedHotkeys: globals.useModifiedHotkeys,
        windowSize: globals.mainWindow.getSize(),
        isFullScreen: globals.mainWindow.isFullScreen(),
        isMaximized: globals.mainWindow.isMaximized(),
        autoHideMenu: globals.autoHideMenu,
        hideCursor: globals.hideCursor,
        isOfflineMode: globals.isOfflineMode
    };

    fs.writeFileSync(settingsFilePath, JSON.stringify(settings));
}

function loadSettings() {
    const userDataPath = app.getPath('userData');
    const settingsFilePath = path.join(userDataPath, 'settings.json');

    if (fs.existsSync(settingsFilePath)) {
        const settingsData = fs.readFileSync(settingsFilePath, 'utf-8');
        const settings = JSON.parse(settingsData);
        globals.closeUtilityWindows = settings.closeUtilityWindows;
        globals.darkMode = settings.darkMode;
        globals.useModifiedHotkeys = settings.useModifiedHotkeys;
        globals.autoHideMenu = settings.autoHideMenu;
        globals.hideCursor = settings.hideCursor;
        globals.isOfflineMode = globals.gameFilesDownloaded ? settings.isOfflineMode : false;
        globals.mainWindow.webContents.send('offline-mode-status', [globals.isOfflineMode, globals.gameDir]);

        // Set the window size, fullscreen state, and maximized state
        if (settings.windowSize) {
            globals.mainWindow.setSize(settings.windowSize[0], settings.windowSize[1]);
        }
        globals.mainWindow.center();
        if (settings.isFullScreen) {
            globals.mainWindow.setFullScreen(true);
        } else if (settings.isMaximized) {
            globals.mainWindow.maximize();
        }
        // Apply the auto-hide menu setting
        if (globals.autoHideMenu) {
            globals.mainWindow.autoHideMenuBar = globals.autoHideMenu;
        }
    }
}

function resetGame() {
    if (globals.isOfflineMode) {
        globals.mainWindow.loadFile(path.join(globals.gameDir, 'index.html'));
    } else {
        globals.mainWindow.loadURL('https://pokerogue.net/');
    }
    globals.mainWindow.webContents.on('did-finish-load', () => {
        setTimeout(() => {
            loadSettings();
            updateMenu();
            applyDarkMode();
            applyCursorHide();
            if (globals.useModifiedHotkeys) {
                loadKeymap();
                registerGlobalShortcuts();
            }
            globals.mainWindow.webContents.send('offline-mode-status', [globals.isOfflineMode, globals.gameDir]);

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
    Menu.setApplicationMenu(require("./tabmenu").createMenu());
}

function loadKeymap() {
    if (globals.useModifiedHotkeys) {
        try {
            const keymapPath = path.join(process.resourcesPath, 'globals.keymap.json');
            const keymapData = fs.readFileSync(keymapPath, 'utf-8');
            globals.keymap = JSON.parse(keymapData);
            console.log('Loaded globals.keymap:', globals.keymap);
        } catch (error) {
            console.error('Failed to load globals.keymap:', error);
        }
    } else {
        globals.keymap = {};
    }
}

function registerGlobalShortcuts() {
    if (globals.useModifiedHotkeys) {
        for (const [originalKey, mappedKey] of Object.entries(globals.keymap)) {
            if (originalKey != mappedKey) {
                globalShortcut.register(originalKey, () => {
                    const focusedWindow = BrowserWindow.getFocusedWindow();
                    if (focusedWindow === globals.mainWindow) {
                        focusedWindow.webContents.sendInputEvent({
                            type: 'keyDown',
                            keyCode: mappedKey
                        });
                        setTimeout(() => {
                            focusedWindow.webContents.sendInputEvent({
                                type: 'keyUp',
                                keyCode: mappedKey
                            });
                        }, 50);
                    }
                });

                globalShortcut.register(`CommandOrControl+${originalKey}`, () => {
                    const focusedWindow = BrowserWindow.getFocusedWindow();
                    if (focusedWindow === globals.mainWindow) {
                        focusedWindow.webContents.sendInputEvent({
                            type: 'keyDown',
                            keyCode: originalKey,
                            modifiers: ['ctrl']
                        });
                        setTimeout(() => {
                            focusedWindow.webContents.sendInputEvent({
                                type: 'keyUp',
                                keyCode: originalKey,
                                modifiers: ['ctrl']
                            });
                        }, 50);
                    }
                });
            }
        }
        console.log('Registered global shortcuts:', Object.keys(globals.keymap));
    }
}

function unregisterGlobalShortcuts() {
    globalShortcut.unregisterAll();
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

module.exports = { 
    createWindow, 
    createPopup, 
    fetchCurrentAppVersionInfo,
    fetchLatestAppVersionInfo,
    fetchCurrentGameVersionInfo,
    fetchLatestGameVersionInfo,
    saveSettings,
    loadSettings,
    resetGame,
    downloadFile,
    updateMenu,
    loadKeymap,
    registerGlobalShortcuts,
    unregisterGlobalShortcuts,
    applyDarkMode,
    applyCursorHide
}