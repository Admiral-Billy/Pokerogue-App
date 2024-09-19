const electronLocalshortcut = require('electron-localshortcut');

const globals = require("./globals");

function registerLocalShortcuts() {
  if (process.platform !== 'win32') {
    // Undo
    electronLocalshortcut.register(globals.mainWindow, 'CmdOrCtrl+Z', () => {
      globals.mainWindow.webContents.undo()
    })
    // Redo
    electronLocalshortcut.register(globals.mainWindow, 'Shift+CmdOrCtrl+Z', () => {
      globals.mainWindow.webContents.redo()
    })
    // Cut
    electronLocalshortcut.register(globals.mainWindow, 'CmdOrCtrl+X', () => {
      globals.mainWindow.webContents.cut()
    })
    // Copy
    electronLocalshortcut.register(globals.mainWindow, 'CmdOrCtrl+C', () => {
      globals.mainWindow.webContents.copy()
    })
    // Paste
    electronLocalshortcut.register(globals.mainWindow, 'CmdOrCtrl+V', () => {
      globals.mainWindow.webContents.paste()
    })
    // Select All
    electronLocalshortcut.register(globals.mainWindow, 'CmdOrCtrl+A', () => {
      globals.mainWindow.webContents.selectAll()
    })
  }
}

module.exports.registerLocalShortcuts = registerLocalShortcuts;