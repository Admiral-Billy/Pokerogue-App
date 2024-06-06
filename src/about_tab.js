const utils = require("./utils");
const { ipcMain } = require('electron');

const getTabData = () => {
  return {
    label: 'About/Links',
    submenu: [{
      label: 'About the app...',
      click: handleClick_About
    },
    {
      label: 'PokeRogue Discord',
      click: () => {
        require('electron').shell.openExternal("https://discord.com/invite/pokerogue");
      }
    },
    {
      label: 'Futaba\'s Discord',
      click: () => {
        require('electron').shell.openExternal("https://discord.gg/PeJbKTCXxh");
      }
    },
    {
      label: 'Game file repo',
      click: () => {
        require('electron').shell.openExternal("https://github.com/Admiral-Billy/pokerogue/releases");
      }
    },
    {
      label: 'PokeRogue app overview/tutorial',
      click: () => {
        require('electron').shell.openExternal("https://www.youtube.com/watch?v=8feJJRHFen0");
      }
    }
    ]
  }
};

let window;

function handleClick_About() {
  const content = `
        <style>
            * {
                font-family: Verdana, sans-serif;
                font-size: 12px;
            }

            .table-outline {
                width: 80%; /* Adjust width as needed */
                margin: 0 auto; /* Center the dialog horizontally */
                // border: 1px solid #ccc; /* Light grey border */
                border-radius: 5px; /* Rounded corners */
                // padding: 20px; /* Add some padding inside the dialog */
            }

            table.table-outline {
                width: 100%; /* Make the table fill the width of the dialog */
                border-collapse: collapse
            }
            
            .table-outline td {
                // border: 1px solid #ccc; /* Light grey border for table cells */
                padding: 1px; /* Add padding inside table cells */
            }

            .table-outline tr:nth-child(even) {
                background-color: #f9f9f9; /* Alternate row background color */
            }
        </style>
        <script>
            function buttonClick_AppUpdate() {
                ipcRenderer.send('about_tab::buttonClick::appUpdate');
            }
            function buttonClick_GameUpdate() {
                ipcRenderer.send('about_tab::buttonClick::gameUpdate');
            }
        </script>
        <table class="table-outline">
            <tr>
                <td>Current App Version</td>
                <td id="currentAppVersion"></td>
            </tr>
            <tr>
                <td>Latest App Version</td>
                <td id="latestAppVersion"></td>
            </tr>
            <tr>
                <td>Current Game Version</td>
                <td id="currentGameVersion"></td>
            </tr>
            <tr>
                <td>Latest Game Version</td>
                <td id="latestGameVersion"></td>
            </tr>
            <tr>
                <td>Author</td>
                <td><a href="https://github.com/Admiral-Billy">Admiral Billy</a></td>
            </tr>
            <tr>
                <td>Project</td>
                <td><a href="https://github.com/Admiral-Billy/Pokerogue-App">Pokerogue-App</a></td>
            </tr>
            <tr>
                <td style="text-align: center;">
                    <!-- Until we implement updating the app, we'll leave this commented out -->
                    <!-- <input id="buttonAppUpdate" type="button" onclick="buttonClick_AppUpdate()" value="Update App Files" disabled/> -->
                </td>
            </tr>
        </table>
    `;
  window = utils.createPopup({
    title: "About",
    width: 350,
    height: 170,
    modal: false,
    closeable: true
  }, content);

  const updateVer = (elemId, ver) => window.webContents.executeJavaScript(`document.getElementById("${elemId}").innerText = "${ver}"`);

    
  new Promise((resolve, _reject) => {
    let n = 0;
    function maybeEnableButton() {
      n++;
      if(n >= 2)
        resolve();
    }
    utils.fetchCurrentAppVersionInfo()
      .then(version => {
        updateVer("currentAppVersion", version);
      })
      .catch(reason => console.error("Failed to fetch current app version with error %O", reason))
      .finally(maybeEnableButton)
    utils.fetchLatestAppVersionInfo()
      .then(releaseData => {
        updateVer("latestAppVersion", releaseData.tag_name.replace(/[^\d.]/g, ""));
      })
      .catch(reason => console.error("Failed to fetch latest app version with error %O", reason))
      .finally(maybeEnableButton)
  }).then(() => window.webContents.executeJavaScript(`document.getElementById("buttonAppUpdate").disabled = document.getElementById("currentAppVersion").innerText === document.getElementById("latestAppVersion").innerText;`));
	
  new Promise((resolve, _reject) => {
    let n = 0;
    function maybeEnableButton() {
      n++;
      if(n >= 2)
        resolve();
    }
    utils.fetchCurrentGameVersionInfo()
      .then(version => {
        updateVer("currentGameVersion", version);
      })
      .catch(reason => console.error("Failed to fetch current game version with error %O", reason))
      .finally(maybeEnableButton);
    utils.fetchLatestGameVersionInfo()
      .then(releaseData => {
        updateVer("latestGameVersion", releaseData.tag_name);
      })
      .catch(reason => console.error("Failed to fetch latest game version with error %O", reason))
      .finally(maybeEnableButton)
  })//.then(() => window.webContents.executeJavaScript(`document.getElementById("buttonGameUpdate").disabled = document.getElementById("currentGameVersion").innerText === document.getElementById("latestGameVersion").innerText;`)); leave commented out until needed again

  window.on('close', () => window = undefined);
}

ipcMain.on('about_tab::buttonClick::appUpdate', (_event, _arg) => {
  // TODO: Implement downloading the app
});

module.exports.getTabData = getTabData;