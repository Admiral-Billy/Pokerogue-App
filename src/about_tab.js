const utils = require("./utils");
const {downloadLatestGameFiles} = require("./file_tab")
const { ipcMain } = require('electron');

const tabData = {
    label: "About",
    click: handleClick_About
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
            function buttonClick_Update() {
                ipcRenderer.send('about_tab::buttonClick::update');
            }
        </script>
        <table class="table-outline">
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
                <td colspan=2 style="text-align: center;"><input id="buttonUpdate" type="button" onclick="buttonClick_Update()" value="Update Game Files" disabled/></td>
            </tr>
        </table>
    `;
    window = utils.createPopup({
        title: "About",
        width: 350,
        height: 140
    }, content);

    const updateVer = (elemId, ver) => window.webContents.executeJavaScript(`document.getElementById("${elemId}").innerText = "${ver}"`);

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
            .catch(reason => console.error("Failed to fetch current version with error %O", reason))
            .finally(maybeEnableButton);
        utils.fetchLatestGameVersionInfo()
            .then(releaseData => {
                updateVer("latestGameVersion", releaseData.tag_name);
            })
            .catch(reason => console.error("Failed to fetch latest version with error %O", reason))
            .finally(maybeEnableButton)
    }).then(() => window.webContents.executeJavaScript(`document.getElementById("buttonUpdate").disabled = document.getElementById("currentGameVersion").innerText === document.getElementById("latestGameVersion").innerText;`));

    window.on('close', () => window = undefined);
}

ipcMain.on('about_tab::buttonClick::update', (_event, _arg) => {
    downloadLatestGameFiles(window)
        .then(() => {
            if(window)
                utils.fetchCurrentGameVersionInfo()
                    .then(version => {
                        window.webContents.executeJavaScript(`
                            document.getElementById("currentGameVersion").innerText = "${version}";
                            document.getElementById("buttonUpdate").disabled = true;
                        `);
                    })
                    .catch(reason => console.error("Failed to fetch latest version with error %O", reason))
        })
        .catch(reason => console.error("Failed to download latest version with error %O", reason))
});

module.exports = { tabData };