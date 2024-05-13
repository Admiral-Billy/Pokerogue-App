// Importing required modules
const {
    app,
    BrowserWindow
} = require('electron');
const path = require('path');
const fs = require('fs');
const DiscordRPC = require('discord-rpc');

const globals = require("./globals");
const utils = require("./utils");

// Create the main application window
async function createWindow() {
    globals.mainWindow = new BrowserWindow({
        width: 1280,
        height: 749,
        autoHideMenuBar: false,
        icon: 'icons/PR',
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteMudle: true,
            preload: path.join(__dirname, 'preload.js'),
            persistSessionStorage: true,
            persistUserDataDirName: 'Pokerogue'
        }
    });

    // Register global shortcuts when the game window is focused
    globals.mainWindow.on('focus', utils.registerGlobalShortcuts);

    // Unregister global shortcuts when the game window loses focus
    globals.mainWindow.on('blur', utils.unregisterGlobalShortcuts);

    utils.loadSettings();
    utils.applyDarkMode();
    utils.applyCursorHide();
    if (globals.useModifiedHotkeys) {
        utils.loadKeymap();
        utils.registerGlobalShortcuts();
    }

    utils.updateMenu();

    globals.mainWindow.on('close', () => {
        utils.saveSettings();
    });

    globals.mainWindow.on('closed', async () => {
        globals.mainWindow = null;

        // Close the wiki window if it's open
        if (globals.wikiWindow) {
            globals.wikiWindow.close();
            globals.wikiWindow = null;
        }

        // Close the pokedex window if it's open
        if (globals.pokedexWindow) {
            globals.pokedexWindow.close();
            globals.pokedexWindow = null;
        }

        // Close the type chart window if it's open
        if (globals.typeChartWindow) {
            globals.typeChartWindow.close();
            globals.typeChartWindow = null;
        }

        // Close the type calculator window if it's open
        if (globals.typeCalculatorWindow) {
            globals.typeCalculatorWindow.close();
            globals.typeCalculatorWindow = null;
        }

        // Close the team builder window if it's open
        if (globals.teamBuilderWindow) {
            globals.teamBuilderWindow.close();
            globals.teamBuilderWindow = null;
        }

        // Close the Smogon window if it's open
        if (globals.smogonWindow) {
            globals.smogonWindow.close();
            globals.smogonWindow = null;
        }

        utils.unregisterGlobalShortcuts();

        app.quit();
    });

    if(globals.discordEnabled) {
        const clientId = '1232165629046292551';
        DiscordRPC.register(clientId);
        const rpc = new DiscordRPC.Client({
            transport: 'ipc'
        });

        let startTime = Date.now();
        let adjustedPlayTime = 0;
        let sessionStartTime = 0;
        
        rpc.connect(clientId)
            .then(() => {
                rpc.on('ready', () => {
                    console.log('Discord Rich Presence is ready!');
                    updateDiscordPresence();
                    setInterval(updateDiscordPresence, 1000);
                });
                rpc.login({
                    clientId
                }).catch(console.error);
            })
            .catch(error => {
                console.log('Discord Rich Presence is not available! %O', error);
                globals.discordEnabled = false;
            });

        async function updateDiscordPresence() {
            globals.mainWindow.webContents.executeJavaScript('window.gameInfo', true)
                .then((gameInfo) => {
                    // Process the gameInfo data
                    let gameData = gameInfo;

                    // Check if the user is on the menu
                    if (gameData.gameMode === 'Title') {
                        adjustedPlayTime = 0;
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
                        let state = `Party:\n${gameData.party
                .map((pokemon) => `Lv. ${pokemon.level} ${pokemon.name}`)
                .join('\n')}`;

                        if (state.length > 128) {
                            state = state.substring(0, 125) + "...";
                        }

                        if (adjustedPlayTime === 0) {
                            sessionStartTime = Date.now();
                            adjustedPlayTime = gameData.playTime * 1000;
                        }

                        // Update the Rich Presence
                        rpc.setActivity({
                            details: details,
                            state: state,
                            startTimestamp: sessionStartTime - adjustedPlayTime,
                            largeImageKey: gameData.biome ? gameData.biome.toLowerCase().replace(/\s/g, '_') + '_discord' : 'logo2',
                            largeImageText: gameData.biome,
                            smallImageKey: 'logo',
                            smallImageText: 'PokéRogue',
                            instance: true,
                        });
                    }
                })
                .catch((error) => {
                    // Fallback for non-existing code
                    rpc.setActivity({
                        startTimestamp: startTime,
                        largeImageKey: 'logo2',
                        largeImageText: 'PokéRogue',
                        instance: true,
                    });
                });
        }
    }

    if (globals.isOfflineMode) {
        globals.mainWindow.loadFile(path.join(globals.gameDir, 'index.html'));
    } else {
        globals.mainWindow.loadURL('https://pokerogue.net/');
    }

    // Fix the resolution
    globals.mainWindow.webContents.on('did-finish-load', () => {
        const gameWidth = 1280;
        const gameHeight = 770;
        setTimeout(() => {
            globals.mainWindow.setSize(gameWidth, 769); // nice
            globals.mainWindow.setSize(gameWidth, gameHeight);
            globals.mainWindow.show();

            // Load the settings after the game has finished loading
            utils.loadSettings();
            globals.mainWindow.center();
        }, 100);
    });
}

// Handle app events
app.whenReady().then(() => {
    globals.gameFilesDownloaded = fs.existsSync(globals.gameDir);

    // Check if the --clear-cache flag is present
    if (process.argv.includes('--clear-cache')) {
        const userDataPath = app.getPath('userData');
        const settingsFilePath = path.join(userDataPath, 'settings.json');
        const localStorageDirPath = path.join(userDataPath, 'Local Storage');

        // Get all files and directories in the user data path
        const files = fs.readdirSync(userDataPath);

        // Delete all files and directories except for settings.json and Local Storage folder
        files.forEach(file => {
            const filePath = path.join(userDataPath, file);
            if (filePath !== settingsFilePath && filePath !== localStorageDirPath) {
                if (fs.lstatSync(filePath).isDirectory()) {
                    fs.rmdirSync(filePath, {
                        recursive: true
                    });
                } else {
                    fs.unlinkSync(filePath);
                }
            }
        });

        // Remove the --clear-cache flag from the command line arguments
        app.commandLine.removeSwitch('clear-cache');
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