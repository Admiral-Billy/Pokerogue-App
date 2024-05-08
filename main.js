// Importing required modules
const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const DiscordRPC = require('discord-rpc');
const AdmZip = require('adm-zip');
const https = require('https');
const ProgressBar = require('electron-progressbar');

// Declaring global variables in the order of the options in the utilities menu
let mainWindow;
let wikiWindow;
let pokedexWindow;
let typeChartWindow;
let typeCalculatorWindow;
let teamBuilderWindow;
let smogonWindow;
let isOfflineMode = false;
let gameFilesDownloaded = false;
let closeUtilityWindows = false;
let darkMode = false;
let keymap = {};
let useModifiedHotkeys = false;
let autoHideMenu = false;
let hideCursor = false;

function saveSettings() {
    const userDataPath = app.getPath('userData');
    const settingsFilePath = path.join(userDataPath, 'settings.json');

    const settings = {
        closeUtilityWindows: closeUtilityWindows,
        darkMode: darkMode,
        useModifiedHotkeys: useModifiedHotkeys,
        windowSize: mainWindow.getSize(),
        isFullScreen: mainWindow.isFullScreen(),
        isMaximized: mainWindow.isMaximized(),
        autoHideMenu: autoHideMenu,
        hideCursor: hideCursor,
        isOfflineMode: isOfflineMode
    };

    fs.writeFileSync(settingsFilePath, JSON.stringify(settings));
}

function loadSettings() {
    const userDataPath = app.getPath('userData');
    const settingsFilePath = path.join(userDataPath, 'settings.json');

    if (fs.existsSync(settingsFilePath)) {
        const settingsData = fs.readFileSync(settingsFilePath, 'utf-8');
        const settings = JSON.parse(settingsData);
        closeUtilityWindows = settings.closeUtilityWindows;
        darkMode = settings.darkMode;
        useModifiedHotkeys = settings.useModifiedHotkeys;
        autoHideMenu = settings.autoHideMenu;
        hideCursor = settings.hideCursor;
        isOfflineMode = gameFilesDownloaded ? settings.isOfflineMode : false;
        
        // Set the window size, fullscreen state, and maximized state
        if (settings.windowSize) {
            mainWindow.setSize(settings.windowSize[0], settings.windowSize[1]);
        }
        mainWindow.center();
        if (settings.isFullScreen) {
            mainWindow.setFullScreen(true);
        } else if (settings.isMaximized) {
            mainWindow.maximize();
        }
        // Apply the auto-hide menu setting
        if (autoHideMenu) {
            mainWindow.autoHideMenuBar = autoHideMenu;
        }
    }
}

function loadKeymap() {
  if (useModifiedHotkeys) {
    try {
      const keymapPath = path.join(process.resourcesPath, 'keymap.json');
      const keymapData = fs.readFileSync(keymapPath, 'utf-8');
      keymap = JSON.parse(keymapData);
      console.log('Loaded keymap:', keymap);
    } catch (error) {
      console.error('Failed to load keymap:', error);
    }
  } else {
    keymap = {};
  }
}

function resetGame() {
	if (isOfflineMode) {
		const gameDir = path.join(__dirname, '..', 'app', 'game');
		mainWindow.loadFile(path.join(gameDir, 'index.html'));
	} else {
		mainWindow.loadURL('https://pokerogue.net/');
	}
    mainWindow.webContents.on('did-finish-load', () => {
        setTimeout(() => {
            loadSettings();
			updateMenu();
            applyDarkMode();
            applyCursorHide();
            if (useModifiedHotkeys) {
                loadKeymap();
                registerGlobalShortcuts();
            }
			
        }, 100);
    });
}

function createMenu() {
    const menuTemplate = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Toggle fullscreen',
                    accelerator: 'F11',
                    click: () => {
                        mainWindow.setFullScreen(!mainWindow.isFullScreen());
                    }
                },
                {
                    label: 'Toggle console',
                    accelerator: 'F12',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                {
                    label: 'Reload',
                    accelerator: 'CommandOrControl+R',
                    click: () => {
                        resetGame();
                    }
                },
                {
                    label: 'Reload (invisible)',
                    accelerator: 'F5',
                    click: () => {
                        resetGame();
                    },
                    visible: false,
                    acceleratorWorksWhenHidden: true
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Download latest files for offline',
                    click: async () => {
                        try {
                            await downloadLatestGameFiles();
                            saveSettings();
                        } catch (error) {
                            console.error('Failed to download the latest game files:', error);
                        }
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    click: () => {
                        mainWindow.close();
                    }
                }
            ]
        },
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Offline mode (uses separate save)',
                    type: 'checkbox',
                    checked: isOfflineMode,
                    enabled: gameFilesDownloaded,
                    click: () => {
                        isOfflineMode = !isOfflineMode;
                        saveSettings();
                        resetGame();
                    }
                },
                {
                    label: 'Auto-hide this menu (Alt to open again)',
                    type: 'checkbox',
                    checked: autoHideMenu,
                    click: () => {
                        autoHideMenu = !autoHideMenu;
                        mainWindow.autoHideMenuBar = autoHideMenu;
                        if (!autoHideMenu) {
                            mainWindow.setMenuBarVisibility(true);
                        }
                        saveSettings();
                    },
                },
                {
                  label: 'Use modified hotkeys', // When enabled, instead of the game's default hotkeys, keys will be remapped according to the keymap.json file. Shortcuts for utility windows will be the same regardless of keybinds.
                  type: 'checkbox',
                  checked: useModifiedHotkeys,
                  click: () => {
                    useModifiedHotkeys = !useModifiedHotkeys;
                    saveSettings();
                    if (useModifiedHotkeys) {
                      loadKeymap();
                      registerGlobalShortcuts();
                    } else {
                      unregisterGlobalShortcuts();
                    }
                  },
                },
                {
                    label: 'Close utility windows instead of hiding', // When enabled, utility windows are completely closed rather than being hidden if they are toggled or exited. This can help save memory, but resets their position every toggle and might result in slower toggles.
                    type: 'checkbox',
                    checked: closeUtilityWindows,
                    click: () => {
                        closeUtilityWindows = !closeUtilityWindows;
                        saveSettings();
                    },
                },
                {
                    label: 'Hide the cursor in the window',
                    type: 'checkbox',
                    checked: hideCursor,
                    click: () => {
                        hideCursor = !hideCursor;
                        applyCursorHide();
                        saveSettings();
                    },
                },
                {
                  label: 'Darker background', // When enabled, the grey background that normally fills the outside of the game will instead be black.
                  type: 'checkbox',
                  checked: darkMode,
                  click: () => {
                    darkMode = !darkMode;
                    applyDarkMode();
                    saveSettings();
                  },
                }
            ]
        },
        {
            label: 'Utilities',
            submenu: [
                {
                    label: 'Wiki',
                    accelerator: 'CommandOrControl+W',
                    click: () => {
                        if (wikiWindow) {
                            if (wikiWindow.isVisible()) {
                                if (closeUtilityWindows) {
                                    wikiWindow.close();
                                    wikiWindow = null;
                                } else {
                                    wikiWindow.hide();
                                }
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
                    label: 'Pokedex',
                    accelerator: 'CommandOrControl+D',
                    click: () => {
                        if (pokedexWindow) {
                            if (pokedexWindow.isVisible()) {
                                if (closeUtilityWindows) {
                                    pokedexWindow.close();
                                    pokedexWindow = null;
                                } else {
                                    pokedexWindow.hide();
                                }
                                mainWindow.focus(); // Set focus to the main window
                            } else {
                                pokedexWindow.show();
                                pokedexWindow.focus(); // Set focus to the Pokedex window
                            }
                        } else {
                            createPokedexWindow();
                        }
                    }
                },
                {
                    label: 'Type Chart',
                    accelerator: 'CommandOrControl+Y',
                    click: () => {
                        if (typeChartWindow) {
                            if (typeChartWindow.isVisible()) {
                                if (closeUtilityWindows) {
                                    typeChartWindow.close();
                                    typeChartWindow = null;
                                } else {
                                    typeChartWindow.hide();
                                }
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
                                if (closeUtilityWindows) {
                                    typeCalculatorWindow.close();
                                    typeCalculatorWindow = null;
                                } else {
                                    typeCalculatorWindow.hide();
                                }
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
                                if (closeUtilityWindows) {
                                    teamBuilderWindow.close();
                                    teamBuilderWindow = null;
                                } else {
                                    teamBuilderWindow.hide();
                                }
                                mainwindow.focus(); // Set focus to the main window
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
                                if (closeUtilityWindows) {
                                    smogonWindow.close();
                                    smogonWindow = null;
                                } else {
                                    smogonWindow.hide();
                                }
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
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        }
    ];
	
	return Menu.buildFromTemplate(menuTemplate);
}

function updateMenu() {
 const menu = createMenu();
 Menu.setApplicationMenu(menu);
}

function registerGlobalShortcuts() {
  if (useModifiedHotkeys) {
      for (const [originalKey, mappedKey] of Object.entries(keymap)) {
        if (originalKey != mappedKey) {
            globalShortcut.register(originalKey, () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow === mainWindow) {
                focusedWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: mappedKey });
                setTimeout(() => {
                  focusedWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: mappedKey });
                }, 50);
              }
            });

            globalShortcut.register(`CommandOrControl+${originalKey}`, () => {
              const focusedWindow = BrowserWindow.getFocusedWindow();
              if (focusedWindow === mainWindow) {
                focusedWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: originalKey, modifiers: ['ctrl'] });
                setTimeout(() => {
                  focusedWindow.webContents.sendInputEvent({ type: 'keyUp', keyCode: originalKey, modifiers: ['ctrl'] });
                }, 50);
              }
            });
        }
      }
      console.log('Registered global shortcuts:', Object.keys(keymap));
  }
}

function unregisterGlobalShortcuts() {
  globalShortcut.unregisterAll();
}

function downloadLatestGameFiles() {
  return new Promise((resolve, reject) => {
    const latestReleaseUrl = 'https://api.github.com/repos/Admiral-Billy/pokerogue/releases/latest';

    const options = {
      headers: {
        'User-Agent': 'Pokerogue-App',
      },
    };

    https.get(latestReleaseUrl, options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const releaseData = JSON.parse(data);
          const zipAsset = releaseData.assets.find((asset) => asset.name === 'game.zip');

          if (zipAsset) {
            const zipUrl = zipAsset.browser_download_url;
            const zipPath = path.join(app.getPath('temp'), 'game.zip');
            const fileStream = fs.createWriteStream(zipPath);

            const progressBar = new ProgressBar({
              indeterminate: false,
              text: 'Downloading game files...',
              detail: 'Preparing to download...',
              maxValue: 100,
              closeOnComplete: true,
            });

            const totalBytes = zipAsset.size;
            let receivedBytes = 0;

            const downloadOptions = {
              ...options,
              timeout: 30000, // Set a timeout of 30 seconds
            };

            https.get(zipUrl, downloadOptions, (response) => {
              if (response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                https.get(redirectUrl, downloadOptions, (response) => {
                  response.on('data', (chunk) => {
                    receivedBytes += chunk.length;
                    const percentage = Math.floor((receivedBytes / totalBytes) * 100);
                    progressBar.value = percentage;
                    progressBar.detail = `${receivedBytes} bytes received...`;
                  });

                  response.pipe(fileStream);
                });
              } else {
                response.on('data', (chunk) => {
                  receivedBytes += chunk.length;
                  const percentage = Math.floor((receivedBytes / totalBytes) * 100);
                  progressBar.value = percentage;
                  progressBar.detail = `${receivedBytes} bytes received...`;
                });

                response.pipe(fileStream);
              }

              fileStream.on('finish', () => {
                fileStream.close();
				progressBar.detail = `Deleting old files...`;

                const zip = new AdmZip(zipPath);
                const gameDir = path.join(__dirname, '..', 'app', 'game');

                // Delete the old game files
                fs.rmSync(gameDir, { recursive: true, force: true });

				progressBar.detail = `Extracting...`;

                zip.extractAllTo(gameDir, true);

                fs.unlinkSync(zipPath);

                gameFilesDownloaded = true;
				updateMenu();
                resolve();
              });
            }).on('error', (error) => {
              progressBar.close();
              console.error('Error downloading game.zip:', error);
              reject(error);
            });
          } else {
            console.error('game.zip asset not found in the latest release');
            reject(new Error('game.zip asset not found in the latest release.'));
          }
        } catch (error) {
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

// Create the main application window
async function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 749,
        autoHideMenuBar: false,
        icon: 'icons/PR',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            persistSessionStorage: true,
            persistUserDataDirName: 'Pokerogue',
			sandbox: false
        }
    });
    
    // Register global shortcuts when the game window is focused
    mainWindow.on('focus', registerGlobalShortcuts);

    // Unregister global shortcuts when the game window loses focus
    mainWindow.on('blur', unregisterGlobalShortcuts);
    
    loadSettings();
    applyDarkMode();
    applyCursorHide();
    if (useModifiedHotkeys) {
        loadKeymap();
        registerGlobalShortcuts();
    }

    // Create the menu from the template
    const menu = createMenu();

    // Set the custom menu as the application menu
    Menu.setApplicationMenu(menu);

    mainWindow.on('close', () => {
        saveSettings();
    });

    mainWindow.on('closed', async () => {
        mainWindow = null;
        
        // Close the wiki window if it's open
        if (wikiWindow) {
            wikiWindow.close();
            wikiWindow = null;
        }

        // Close the pokedex window if it's open
        if (pokedexWindow) {
            pokedexWindow.close();
            pokedexWindow = null;
        }

        // Close the type chart window if it's open
        if (typeChartWindow) {
            typeChartWindow.close();
            typeChartWindow = null;
        }

        // Close the type calculator window if it's open
        if (typeCalculatorWindow) {
            typeCalculatorWindow.close();
            typeCalculatorWindow = null;
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

        unregisterGlobalShortcuts();

        app.quit();
    });

    const clientId = '1232165629046292551';
    DiscordRPC.register(clientId);
    const rpc = new DiscordRPC.Client({ transport: 'ipc' });
    
    rpc.on('ready', () => {
        console.log('Discord Rich Presence is ready!');
        updateDiscordPresence();
    });
    
    let startTime = Date.now();

    async function updateDiscordPresence() {
      mainWindow.webContents.executeJavaScript('window.gameInfo', true)
        .then((gameInfo) => {
          // Process the gameInfo data
          let gameData = gameInfo;

          // Check if the user is on the menu
          if (gameData.gameMode === 'Title') {
            rpc.setActivity({
              details: 'On the menu',
              startTimestamp: startTime,
              largeImageKey: 'logo2',
              largeImageText: 'PokéRogue',
              instance: true,
            });
          } else {
            // Format the details string
            const details = `${gameData.gameMode} | Wave: ${gameData.wave} | ${gameData.biome}`;

            // Format the state string with the Pokemon list
            const state = `Hover here for full Pokemon list...\n\nPokemon:\n${gameData.party
              .map((pokemon) => `Level ${pokemon.level} ${pokemon.name}`)
              .join('\n')}`;

            // Update the Rich Presence
            rpc.setActivity({
              details: details,
              state: state,
              startTimestamp: startTime,
              largeImageKey: gameData.biome ? gameData.biome.toLowerCase().replace(/\s/g, '_') + '_discord' : 'logo2',
              largeImageText: gameData.biome,
              smallImageKey: 'logo',
              smallImageText: 'PokéRogue',
              instance: true,
            });
          }
        })
        .catch((error) => {
          console.error('Error executing JavaScript:', error);
        });
    }

    // Start updating the Rich Presence every second
    setInterval(updateDiscordPresence, 1000);
    
    rpc.login({ clientId }).catch(console.error);

    if (isOfflineMode) {
        const gameDir = path.join(__dirname, '..', 'app', 'game');
        mainWindow.loadFile(path.join(gameDir, 'index.html'));
    } else {
        mainWindow.loadURL('https://pokerogue.net/');
    }

    // Fix the resolution
    mainWindow.webContents.on('did-finish-load', () => {
        const gameWidth = 1280;
        const gameHeight = 770;
        setTimeout(() => {
            mainWindow.setSize(gameWidth, 769); // nice
            mainWindow.setSize(gameWidth, gameHeight);
            mainWindow.show();

            // Load the settings after the game has finished loading
            loadSettings();
            mainWindow.center();
        }, 100);
    });
}

function applyDarkMode() {
  if (darkMode) {
    mainWindow.webContents.insertCSS(`
      #app {
        background: black;
      }
    `);
  } else {
    mainWindow.webContents.insertCSS(`
      #app {
        background: #484050;
      }
    `);
  }
}

function applyCursorHide() {
  if (hideCursor) {
    mainWindow.webContents.insertCSS(`
      #app {
        cursor: none;
      }
    `);
  } else {
    mainWindow.webContents.insertCSS(`
      #app {
        cursor: auto;
      }
    `);
  }
}

// Create the wiki window
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
            buttonsContainer.appendChild(forwardButton);

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
    
    wikiWindow.on('close', (event) => {
        if (wikiWindow && !closeUtilityWindows) {
            event.preventDefault();
            wikiWindow.hide(); // Hide the window instead of closing it
        }
        else
        {
            wikiWindow = null;
        }
        if (mainWindow) {
            mainWindow.focus();
        }
    });
}

// Create the Pokedex window
async function createPokedexWindow() {
    pokedexWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        icon: 'icons/PR',
        webPreferences: {
            nodeIntegration: false
        }
    });

    // Initialize the ad blocker for the Pokedex window
    const pokedexWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    pokedexWindowBlocker.enableBlockingInSession(pokedexWindow.webContents.session);

    pokedexWindow.loadURL('https://pokemondb.net/pokedex/all');

    // Enable back and forward navigation
    pokedexWindow.webContents.on('did-finish-load', () => {
        pokedexWindow.focus(); // Set focus to the Pokedex window
        pokedexWindow.webContents.executeJavaScript(`
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
                window.location.href = 'https://pokemondb.net/pokedex/all';
            });
            buttonsContainer.appendChild(homeButton);

            document.body.appendChild(buttonsContainer);
        `);
    });
    
    pokedexWindow.on('close', (event) => {
        if (pokedexWindow && !closeUtilityWindows) {
            event.preventDefault();
            pokedexWindow.hide(); // Hide the window instead of closing it
        }
        else {
            pokedexWindow = null;
        }
        if (mainWindow) {
            mainWindow.focus();
        }
    });
}

// Create the type chart window
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
        if (typeChartWindow && !closeUtilityWindows) {
            event.preventDefault();
            typeChartWindow.hide(); // Hide the window instead of closing it
        }
        else {
            typeChartWindow = null;
        }
        if (mainWindow) {
            mainWindow.focus();
        }
    });
}

// Create the type calculator window
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

    // Initialize the ad blocker for the type calculator window
    const typeCalculatorWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    typeCalculatorWindowBlocker.enableBlockingInSession(typeCalculatorWindow.webContents.session);

    typeCalculatorWindow.loadURL('https://www.pkmn.help');

    typeCalculatorWindow.webContents.on('did-finish-load', () => {
        typeCalculatorWindow.show(); // Show the window when the content is loaded
        typeCalculatorWindow.focus(); // Set focus to the type calculator window
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
            buttonsContainer.className = '

navigation-buttons';

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
        if (typeCalculatorWindow && !closeUtilityWindows) {
            event.preventDefault();
            typeCalculatorWindow.hide(); // Hide the window instead of closing it
        }
        else {
            typeCalculatorWindow = null;
        }
        if (mainWindow) {
            mainWindow.focus();
        }
    });
}

// Create the team builder window
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
            forwardButton.addEventListener

('click', () => {
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
    
    teamBuilderWindow.on('close', (event) => {
        if (teamBuilderWindow && !closeUtilityWindows) {
            event.preventDefault();
            teamBuilderWindow.hide(); // Hide the window instead of closing it
        }
        else {
            teamBuilderWindow = null;
        }
        if (mainWindow) {
            mainWindow.focus();
        }
    });
}

// Create the Smogon window
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

    // Enable back and forward navigation
    smogonWindow.webContents.on('did-finish-load', () => {
        smogonWindow.focus(); // Set focus to the Smogon window
        smogonWindow.webContents.executeJavaScript(`
            const style = document.createElement('style');
            style.innerHTML = '\
                .navigation-buttons {\
                    position: fixed;\
                    top: 10px;\
                    right: 10px;\
                    z-index: 9999;\
                }\
                .navigation-button {\
                    background-color: #333 !important;\
                    color: #fff !important;\
                    border: none !important;\
                    border-radius: 4px !important;\
                    padding: 6px 12px !important;\
                    margin-left: 5px !important;\
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
    
    smogonWindow.on('close', (event) => {
        if (smogonWindow && !closeUtilityWindows) {
            event.preventDefault();
            smogonWindow.hide(); // Hide the window instead of closing it
        }
        else {
            smogonWindow = null;
        }
        if (mainWindow) {
            mainWindow.focus();
        }
    });
}

// Handle app events
app.whenReady().then(() => {
    const gameDir = path.join(__dirname, '..', 'app', 'game');
    gameFilesDownloaded = fs.existsSync(gameDir);
    createWindow();
  if (useModifiedHotkeys) {
    loadKeymap();
    registerGlobalShortcuts();
  }
});

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});