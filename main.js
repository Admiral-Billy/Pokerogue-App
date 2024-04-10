const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 749, // 1 smaller to force the game to resize and fix a weird startup resolution issue
    autoHideMenuBar: true,
	icon: 'icons/PR',
    webPreferences: {
      nodeIntegration: false,
      persistSessionStorage: true,
      persistUserDataDirName: 'Pokerogue'
    }
  });

   win.loadURL('https://pokerogue.net/');
   win.webContents.on('did-finish-load', () => {
   const gameWidth = 1280;
   const gameHeight = 750;
   win.setSize(gameWidth, gameHeight);
   win.center();
 });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});