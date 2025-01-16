const {
  ElectronBlocker
} = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const utils = require("./utils");
const globals = require("./globals");

const getTabData = () => { return {
  label: 'Utilities',
  submenu: [{
    label: 'Wiki',
    accelerator: 'CommandOrControl+W',
    click: () => {
      if (globals.wikiWindow) {
        if (globals.wikiWindow.isVisible()) {
          if (globals.closeUtilityWindows) {
            globals.wikiWindow.close();
            globals.wikiWindow = null;
          } else {
            globals.wikiWindow.hide();
          }
          globals.mainWindow.focus(); // Set focus to the main window
        } else {
          globals.wikiWindow.show();
          globals.wikiWindow.focus(); // Set focus to the wiki window
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
      if (globals.pokedexWindow) {
        if (globals.pokedexWindow.isVisible()) {
          if (globals.closeUtilityWindows) {
            globals.pokedexWindow.close();
            globals.pokedexWindow = null;
          } else {
            globals.pokedexWindow.hide();
          }
          globals.mainWindow.focus(); // Set focus to the main window
        } else {
          globals.pokedexWindow.show();
          globals.pokedexWindow.focus(); // Set focus to the Pokedex window
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
      if (globals.typeChartWindow) {
        if (globals.typeChartWindow.isVisible()) {
          if (globals.closeUtilityWindows) {
            globals.typeChartWindow.close();
            globals.typeChartWindow = null;
          } else {
            globals.typeChartWindow.hide();
          }
          globals.mainWindow.focus(); // Set focus to the main window
        } else {
          globals.typeChartWindow.show();
          globals.typeChartWindow.focus(); // Set focus to the type chart window
        }
      } else {
        createTypeChartWindow();
      }
    }
  },
  {
    label: 'Horizontal Type Chart',
    accelerator: 'CommandOrControl+H',
    click: () => {
      if (globals.horizontalTypeChartWindow) {
        if (globals.horizontalTypeChartWindow.isVisible()) {
          if (globals.closeUtilityWindows) {
            globals.horizontalTypeChartWindow.close();
            globals.horizontalTypeChartWindow = null;
          } else {
            globals.horizontalTypeChartWindow.hide();
          }
          globals.mainWindow.focus(); // Set focus to the main window
        } else {
          globals.horizontalTypeChartWindow.show();
          globals.horizontalTypeChartWindow.focus(); // Set focus to the type chart window
        }
      } else {
        createHorizontalTypeChartWindow();
      }
    }
  },
  {
    label: 'Type Calculator',
    accelerator: 'CommandOrControl+T',
    click: () => {
      if (globals.typeCalculatorWindow) {
        if (globals.typeCalculatorWindow.isVisible()) {
          if (globals.closeUtilityWindows) {
            globals.typeCalculatorWindow.close();
            globals.typeCalculatorWindow = null;
          } else {
            globals.typeCalculatorWindow.hide();
          }
          globals.mainWindow.focus(); // Set focus to the main window
        } else {
          globals.typeCalculatorWindow.show();
          globals.typeCalculatorWindow.focus(); // Set focus to the type calculator window
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
      if (globals.teamBuilderWindow) {
        if (globals.teamBuilderWindow.isVisible()) {
          if (globals.closeUtilityWindows) {
            globals.teamBuilderWindow.close();
            globals.teamBuilderWindow = null;
          } else {
            globals.teamBuilderWindow.hide();
          }
          globals.mainWindow.focus(); // Set focus to the main window
        } else {
          globals.teamBuilderWindow.show();
          globals.teamBuilderWindow.focus(); // Set focus to the team builder window
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
      if (globals.smogonWindow) {
        if (globals.smogonWindow.isVisible()) {
          if (globals.closeUtilityWindows) {
            globals.smogonWindow.close();
            globals.smogonWindow = null;
          } else {
            globals.smogonWindow.hide();
          }
          globals.mainWindow.focus(); // Set focus to the main window
        } else {
          globals.smogonWindow.show();
          globals.smogonWindow.focus(); // Set focus to the Smogon window
        }
      } else {
        createSmogonWindow();
      }
    }
  }
  ]
};

// Create the wiki window
async function createWikiWindow() {
  globals.wikiWindow = utils.createWindow({
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
  wikiWindowBlocker.enableBlockingInSession(globals.wikiWindow.webContents.session);

  globals.wikiWindow.loadURL('https://wiki.pokerogue.net/');

  // Enable back and forward navigation
  globals.wikiWindow.webContents.on('did-finish-load', () => {
    globals.wikiWindow.focus(); // Set focus to the wiki window
    globals.wikiWindow.webContents.executeJavaScript(`
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

  globals.wikiWindow.on('close', (event) => {
    if (globals.wikiWindow && !globals.closeUtilityWindows) {
      event.preventDefault();
      globals.wikiWindow.hide(); // Hide the window instead of closing it
    } else {
      globals.wikiWindow = null;
    }
    if (globals.mainWindow) {
      globals.mainWindow.focus();
    }
  });
}

// Create the Pokedex window
async function createPokedexWindow() {
  globals.pokedexWindow = utils.createWindow({
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
  pokedexWindowBlocker.enableBlockingInSession(globals.pokedexWindow.webContents.session);

  globals.pokedexWindow.loadURL('https://wiki.pokerogue.net/dex:pokedex');

  // Enable back and forward navigation
  globals.pokedexWindow.webContents.on('did-finish-load', () => {
    globals.pokedexWindow.focus(); // Set focus to the Pokedex window
    globals.pokedexWindow.webContents.executeJavaScript(`
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

  globals.pokedexWindow.on('close', (event) => {
    if (globals.pokedexWindow && !globals.closeUtilityWindows) {
      event.preventDefault();
      globals.pokedexWindow.hide(); // Hide the window instead of closing it
    } else {
      globals.pokedexWindow = null;
    }
    if (globals.mainWindow) {
      globals.mainWindow.focus();
    }
  });
}

// Create the type chart window
function createTypeChartWindow() {
  globals.typeChartWindow = utils.createWindow({
    width: 670,
    height: 1000,
    icon: 'icons/PR',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  globals.typeChartWindow.loadFile('type-chart.png');

  globals.typeChartWindow.on('close', (event) => {
    if (globals.typeChartWindow && !globals.closeUtilityWindows) {
      event.preventDefault();
      globals.typeChartWindow.hide(); // Hide the window instead of closing it
    } else {
      globals.typeChartWindow = null;
    }
    if (globals.mainWindow) {
      globals.mainWindow.focus();
    }
  });
}

// Create the horizontal type chart window
function createHorizontalTypeChartWindow() {
  globals.horizontalTypeChartWindow = utils.createWindow({
    width: 1300,
    height: 600,
    icon: 'icons/PR',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  globals.horizontalTypeChartWindow.loadFile('type-chart-2.png');

  globals.horizontalTypeChartWindow.on('close', (event) => {
    if (globals.horizontalTypeChartWindow && !globals.closeUtilityWindows) {
      event.preventDefault();
      globals.horizontalTypeChartWindow.hide(); // Hide the window instead of closing it
    } else {
      globals.horizontalTypeChartWindow = null;
    }
    if (globals.mainWindow) {
      globals.mainWindow.focus();
    }
  });
}

// Create the type calculator window
async function createTypeCalculatorWindow() {
  globals.typeCalculatorWindow = utils.createWindow({
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
  typeCalculatorWindowBlocker.enableBlockingInSession(globals.typeCalculatorWindow.webContents.session);

  globals.typeCalculatorWindow.loadURL('https://www.pkmn.help');

  globals.typeCalculatorWindow.webContents.on('did-finish-load', () => {
    globals.typeCalculatorWindow.show(); // Show the window when the content is loaded
    globals.typeCalculatorWindow.focus(); // Set focus to the type calculator window
    globals.typeCalculatorWindow.webContents.executeJavaScript(`
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

  globals.typeCalculatorWindow.on('close', (event) => {
    if (globals.typeCalculatorWindow && !globals.closeUtilityWindows) {
      event.preventDefault();
      globals.typeCalculatorWindow.hide(); // Hide the window instead of closing it
    } else {
      globals.typeCalculatorWindow = null;
    }
    if (globals.mainWindow) {
      globals.mainWindow.focus();
    }
  });
}

// Create the team builder window
async function createTeamBuilderWindow() {
  globals.teamBuilderWindow = utils.createWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false
    }
  });

  // Initialize the ad blocker for the team builder window
  const teamBuilderWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  teamBuilderWindowBlocker.enableBlockingInSession(globals.teamBuilderWindow.webContents.session);

  globals.teamBuilderWindow.loadURL('https://marriland.com/tools/team-builder/');

  // Enable back and forward navigation
  globals.teamBuilderWindow.webContents.on('did-finish-load', () => {
    globals.teamBuilderWindow.focus(); // Set focus to the team builder window
    globals.teamBuilderWindow.webContents.executeJavaScript(`
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

  globals.teamBuilderWindow.on('close', (event) => {
    if (globals.teamBuilderWindow && !globals.closeUtilityWindows) {
      event.preventDefault();
      globals.teamBuilderWindow.hide(); // Hide the window instead of closing it
    } else {
      globals.teamBuilderWindow = null;
    }
    if (globals.mainWindow) {
      globals.mainWindow.focus();
    }
  });
}

// Create the Smogon window
async function createSmogonWindow() {
  globals.smogonWindow = utils.createWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false
    }
  });

  // Initialize the ad blocker for the Smogon window
  const smogonWindowBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  smogonWindowBlocker.enableBlockingInSession(globals.smogonWindow.webContents.session);

  globals.smogonWindow.loadURL('https://www.smogon.com/dex/sv/pokemon/');

  // Enable back and forward navigation
  globals.smogonWindow.webContents.on('did-finish-load', () => {
    globals.smogonWindow.focus(); // Set focus to the Smogon window
    globals.smogonWindow.webContents.executeJavaScript(`
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

  globals.smogonWindow.on('close', (event) => {
    if (globals.smogonWindow && !globals.closeUtilityWindows) {
      event.preventDefault();
      globals.smogonWindow.hide(); // Hide the window instead of closing it
    } else {
      globals.smogonWindow = null;
    }
    if (globals.mainWindow) {
      globals.mainWindow.focus();
    }
  });
}}

module.exports.getTabData = getTabData;
