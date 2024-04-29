// Importing required modules
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { exec } = require('child_process');
const DiscordRPC = require('discord-rpc');

// Declaring global variables in the order of the options in the utilities menu
let mainWindow;
let loadingWindow;
let wikiWindow;
let pokedexWindow;
let typeChartWindow;
let typeCalculatorWindow;
let typeCalculatorLoadingWindow;
let typeCalculatorProcess = null;
let teamBuilderWindow;
let smogonWindow;
let viteProcess = null;
let isOfflineMode = process.argv.includes('--offline');
let closeUtilityWindows = false;

function saveSettings() {
    const userDataPath = app.getPath('userData');
    const settingsFilePath = path.join(userDataPath, 'settings.json');

    const settings = {
        closeUtilityWindows: closeUtilityWindows
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
    }
}

// Create the main application window
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
	
	loadSettings();
	let menuTemplate = [];
	// Create a custom menu template
	if (!isOfflineMode) {
		const clientId = '1232165629046292551';
		DiscordRPC.register(clientId);
		const rpc = new DiscordRPC.Client({ transport: 'ipc' });
		
		rpc.on('ready', () => {
			console.log('Discord Rich Presence is ready!');
			updateDiscordPresence();
		});
		
		let startTime = Date.now();

		async function updateDiscordPresence() {
			// Placeholder data (replace with actual game data)
			const gameData = {
				gameMode: 'Classic',
				biome: 'Laboratory',
				currentWave: 50,
				pokemonList: [
					{ name: 'Pikachu', level: 36 },
					{ name: 'Charmander', level: 40 },
					{ name: 'Bulbasaur', level: 28 },
					{ name: 'Squirtle', level: 32 },
				],
			};

			// Format the details string
			const details = `${gameData.gameMode} | Wave: ${gameData.currentWave} | ${gameData.biome}`;

			// Format the state string with the Pokemon list
			const state = `Hover here for full Pokemon list...\n\nPokemon:\n${gameData.pokemonList
				.map((pokemon) => `Level ${pokemon.level} ${pokemon.name}`)
				.join('\n')}`;

			// Update the Rich Presence
			rpc.setActivity({
				startTimestamp: startTime,
				largeImageKey: 'logo',
				largeImageText: 'PokeRogue',
				instance: true,
			});
		}

		// Start updating the Rich Presence every second
		setInterval(updateDiscordPresence, 1000);
		
		rpc.login({ clientId }).catch(console.error);
		
		menuTemplate = [
			{
				label: 'Settings',
				submenu: [
					{
						label: 'Close utility windows instead of hiding',
						type: 'checkbox',
						checked: closeUtilityWindows,
						click: () => {
							closeUtilityWindows = !closeUtilityWindows;
							saveSettings();
						},
						tooltip: 'When enabled, utility windows are completely closed rather than being hidden if they are toggled or exited. This can help save memory, but resets their position every toggle and might result in slower toggles.'
					}
				]
			},
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
						label: 'Toggle Fullscreen',
						accelerator: 'F11',
						click: () => {
							mainWindow.setFullScreen(!mainWindow.isFullScreen());
						}
					},
					{
						label: 'Toggle Console',
						accelerator: 'F12',
						click: () => {
							mainWindow.webContents.toggleDevTools();
						}
					},
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
	}
	else {
		menuTemplate = [
			{
				label: 'Settings',
				submenu: [
					{
						label: 'Close utility windows instead of hiding',
						type: 'checkbox',
						checked: closeUtilityWindows,
						click: () => {
							closeUtilityWindows = !closeUtilityWindows;
							saveSettings();
						},
						tooltip: 'When enabled, utility windows are completely closed rather than being hidden if they are toggled or exited. This can help save memory, but resets their position every toggle and might result in slower toggles.'
					}
				]
			},
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
						label: 'Toggle Fullscreen',
						accelerator: 'F11',
						click: () => {
							mainWindow.setFullScreen(!mainWindow.isFullScreen());
						}
					},
					{
						label: 'Toggle Console',
						accelerator: 'F12',
						click: () => {
							mainWindow.webContents.toggleDevTools();
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
	}

	// Create the menu from the template
	const menu = Menu.buildFromTemplate(menuTemplate);

	// Set the custom menu as the application menu
	Menu.setApplicationMenu(menu);

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

		// Terminate the type calculator process if it's running in offline mode
		if (typeCalculatorProcess) {
			process.kill(typeCalculatorProcess.pid);
			console.log("Terminated type calculator process");
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

		// Terminate the Vite process if it's running
		if (viteProcess) {
			process.kill(viteProcess.pid);
			console.log("Terminated Vite process");
		}

		app.quit();
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

	// Fix the resolution and get rid of the loading screen if it exists
	mainWindow.webContents.on('did-finish-load', () => {
		const gameWidth = 1280;
		const gameHeight = 750;
		setTimeout(() => {
			mainWindow.setSize(gameWidth, 749);
			mainWindow.setSize(gameWidth, gameHeight);
			mainWindow.show();
			if (loadingWindow) {
				loadingWindow.close();
				loadingWindow = null;
			}
		}, 100);
	});
}

// Start the Vite server for offline mode
function startServer() {
	const gameDir = path.join(__dirname, '..', 'app', 'game');
	if (!fs.existsSync(gameDir)) {
		console.log('Game files not found. Please run the update script to download the game (located in the resources folder).');
		showErrorBox();
		return;
	}

	const nodePath = 'node'; // Assuming 'node' is in the system's PATH
	const scriptPath = path.join(gameDir, 'node_modules', 'vite', 'bin', 'vite.js');
	const args = ['--port', '8000']; // Add any additional arguments if needed

	viteProcess = spawn(nodePath, [scriptPath, ...args], {
		cwd: gameDir,
		stdio: 'ignore'
	});

	viteProcess.on('close', (code) => {
		console.log(`Vite process exited with code ${code}`);
	});
}

// Show an error dialog when game files are not found
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

// Start the Vite server for the type calculator in offline mode
function startTypeCalculatorServer() {
	const typeCalculatorDir = path.join(__dirname, '..', 'app', 'type-calculator');

	const nodePath = 'node'; // Assuming 'node' is in the system's PATH
	const scriptPath = path.join(typeCalculatorDir, 'node_modules', 'vite', 'bin', 'vite.js');
	const args = ['--port', '5173']; // Add any additional arguments if needed

	typeCalculatorProcess = spawn(nodePath, [scriptPath, ...args], {
		cwd: typeCalculatorDir,
		stdio: 'ignore'
	});

	typeCalculatorProcess.on('close', (code) => {
		console.log(`Type calculator process exited with code ${code}`);
	});
}

// Show an error dialog when type calculator files are not found
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

// Handle IPC events
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

// Handle app events
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