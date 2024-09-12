const globals = require("./globals");
const {
  app,
} = require('electron');
const AdmZip = require('adm-zip');
const ProgressBar = require('electron-progressbar');
const path = require('path');
const fs = require('fs');
const utils = require("./utils");

const getTabData = () => { return {
  label: 'File',
  submenu: [{
    label: 'Toggle fullscreen',
    accelerator: 'F11',
    click: handleClick_ToggleFullscreen
  },
  {
    label: 'Toggle console',
    accelerator: 'F12',
    click: handleClick_ToggleConsole
  },
  {
    label: 'Reload',
    accelerator: 'CommandOrControl+R',
    click: handleClick_Reload
  },
  {
    label: 'Reload (invisible)',
    accelerator: 'F5',
    click: handleClick_Reload,
    visible: false,
    acceleratorWorksWhenHidden: true
  },
  {
    label: 'Reload + clear cache',
    accelerator: 'CommandOrControl+F5',
    click: handleClick_ReloadAndClear
  },
  { type: 'separator' },
  {
    label: 'Download files for offline',
    submenu: [
      {
        label: 'Download latest game files (for offline)',
        click: handleClick_DownloadLatest
      },
      {
        label: 'Download Futaba\'s build',
        click: handleClick_DownloadLatestFutaba
      }
    ]
  },
  { type: 'separator' },
  {
    label: 'Quit',
    accelerator: (process.platform === 'darwin') ? 'Command+Q' : "Alt+F4",
    click: handleClick_Quit
  }
  ]
}};

function handleClick_ToggleFullscreen() {
  globals.mainWindow.setFullScreen(!globals.mainWindow.isFullScreen());
}

function handleClick_ToggleConsole() {
  globals.mainWindow.webContents.toggleDevTools();
}

function handleClick_Reload() {
  utils.resetGame();
}

function handleClick_ReloadAndClear() {
  clearCache();
}

async function handleClick_DownloadLatest() {
  try {
    await downloadLatestGameFiles(globals.mainWindow, false);
    utils.saveSettings();
  } catch (error) {
    console.error('Failed to download the latest game files:', error);
  }
}

async function handleClick_DownloadLatestFutaba() {
  try {
    await downloadLatestGameFiles(globals.mainWindow, true);
    utils.saveSettings();
  } catch (error) {
    console.error('Failed to download the latest futaba files:', error);
  }
}

function handleClick_Quit() {
  globals.mainWindow.close();
}

// Implementations

function clearCache() {
  // Set a flag to indicate that the cache should be cleared on the next launch
  app.commandLine.appendSwitch('clear-cache');

  // Relaunch the app
  app.relaunch({
    args: process.argv.slice(1).concat(['--clear-cache'])
  });

  // Quit the current instance
  app.quit();
}

let progressBar;
let downloadOngoing = false;

function downloadLatestGameFiles(parentWindow, modded) {
  return new Promise((resolve, reject) => {
    utils.fetchLatestGameVersionInfo()
      .then(releaseData => {
        let zipAsset;
        if (modded) {
          zipAsset = releaseData.assets.find((asset) => asset.name === 'game_futaba_mod.zip');
        }
        else {
	                zipAsset = releaseData.assets.find((asset) => asset.name === 'game.zip');
        }

        if (zipAsset) {
          const zipUrl = zipAsset.browser_download_url;
          const zipPath = path.join(app.getPath('temp'), 'game.zip');

          let opts = {
            indeterminate: false,
            text: 'Downloading game files...',
            detail: 'Preparing to download...',
            maxValue: 100,
            closeOnComplete: true,
            modal: true,
            alwaysOnTop: true,
          };

          if(parentWindow)
            opts.parent = parentWindow

          progressBar = new ProgressBar(opts);

          const totalBytes = zipAsset.size;
          function onBytesReceived(receivedBytes) {
            if(!progressBar)
              return;
            const percentage = Math.floor((receivedBytes / totalBytes) * 100);
            progressBar.value = percentage;
            progressBar.detail = `${receivedBytes} bytes received...`;
          }
          if(!downloadOngoing) {
            downloadOngoing = true;
            utils.downloadFile(zipUrl, zipPath, onBytesReceived)
              .then(_ => {
                progressBar.detail = `Deleting old files...`;
                
                const zip = new AdmZip(zipPath);
                
                // Delete the old game files
                fs.rmSync(globals.gameDir, {
                  recursive: true,
                  force: true
                });
                
                progressBar.detail = `Extracting... (This may take a while)`;
                
                zip.extractAllTo(globals.gameDir, true);
                
                fs.unlinkSync(zipPath);
                
                // Now that we've saved the files, we write the current tag version for reference
                console.log("globals.currentVersionPath: %O", globals.currentVersionPath);
                console.log("releaseData.tag_name: %O", releaseData.tag_name);
                fs.writeFile(globals.currentVersionPath, releaseData.tag_name, 'utf8', (err) => {
                  if(err)
                    console.error("Failed to write Current Version with error %O", err);
                });
                globals.gameFilesDownloaded = true;
                utils.updateMenu();
                if (globals.isOfflineMode) {
                  utils.resetGame();
                }
                resolve();
              })
              .catch(error => {
                reject(error);
              })
              .finally(() => downloadOngoing = false);
          }
        } else {
          console.error('game.zip asset not found in the latest release');
          reject(new Error('game.zip asset not found in the latest release.'));
        }
      })
      .catch(reason => {
        reject(reason);
      })
  });
}

module.exports.getTabData = getTabData;
module.exports.downloadLatestGameFiles = downloadLatestGameFiles;