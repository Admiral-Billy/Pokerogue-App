const utils = require("./utils");
const globals = require("./globals");

const getTabData = () => { return {
  label: 'Settings',
  submenu: [//{
    //label: 'Use beta for Online mode',
    //type: 'checkbox',
    //checked: globals.isBeta,
    //click: () => {
    //globals.isBeta = !globals.isBeta;
    //utils.saveSettings();
	  //utils.resetGame();
    //},
  //},
    {
      label: 'Offline mode (uses separate save, requires game files)',
      type: 'checkbox',
      checked: globals.isOfflineMode,
      enabled: globals.gameFilesDownloaded,
      click: () => {
        globals.isOfflineMode = !globals.isOfflineMode;
        utils.saveSettings();
        utils.resetGame();
      }
    },
	 {
      label: 'PokeRogueModLoader (uses separate server and save)',
      type: 'checkbox',
      checked: globals.isPRMLMode,
      click: () => {
		  globals.isOfflineMode = false;
		  globals.isPRMLMode = !globals.isPRMLMode
		  utils.saveSettings();
		  utils.resetGame();
      }
    },
    {
      label: 'Mute game',
      type: 'checkbox',
      checked: globals.isMuted,
      accelerator: 'CommandOrControl+Shift+M',
      click: () => {
        globals.isMuted = !globals.isMuted;
        if (globals.isMuted) {
          globals.mainWindow.webContents.audioMuted = true;
        } else {
          globals.mainWindow.webContents.audioMuted = false;
        }
        utils.saveSettings();
      },
    },
    {
      label: 'Auto-hide this menu (Alt to open again)',
      type: 'checkbox',
      checked: globals.autoHideMenu,
      click: () => {
        globals.autoHideMenu = !globals.autoHideMenu;
        globals.mainWindow.setAutoHideMenuBar(globals.autoHideMenu);
        globals.mainWindow.setMenuBarVisibility(!globals.autoHideMenu);
        utils.saveSettings();
      },
    },
    {
      label: 'Close utility windows instead of hiding', // When enabled, utility windows are completely closed rather than being hidden if they are toggled or exited. This can help save memory, but resets their position every toggle and might result in slower toggles.
      type: 'checkbox',
      checked: globals.closeUtilityWindows,
      click: () => {
        globals.closeUtilityWindows = !globals.closeUtilityWindows;
        utils.saveSettings();
      },
    },
    {
      label: 'Hide the cursor in the window',
      type: 'checkbox',
      checked: globals.hideCursor,
      click: () => {
        globals.hideCursor = !globals.hideCursor;
        utils.applyCursorHide();
        utils.saveSettings();
      },
    },
    {
      label: 'Darker background', // When enabled, the grey background that normally fills the outside of the game will instead be black.
      type: 'checkbox',
      checked: globals.darkMode,
      click: () => {
        globals.darkMode = !globals.darkMode;
        utils.applyDarkMode();
        utils.saveSettings();
      },
    }]
}};

module.exports.getTabData = getTabData;