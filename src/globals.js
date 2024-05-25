const path = require('path');
const { EventEmitter } = require('stream');

let mainWindow;
let wikiWindow;
let pokedexWindow;
let typeChartWindow;
let horizontalTypeChartWindow;
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
let gameDir;
let currentVersionPath;
let latestAppReleaseUrl = 'https://api.github.com/repos/Admiral-Billy/Pokerogue-App/releases/latest';
let latestGameReleaseUrl = 'https://api.github.com/repos/Admiral-Billy/pokerogue/releases/latest';
let httpOptions = {
    headers: {
        'User-Agent': 'Pokerogue-App',
    }
};
let discordEnabled = true;

module.exports.mainWindow = mainWindow;
module.exports.wikiWindow = wikiWindow;
module.exports.pokedexWindow = pokedexWindow;
module.exports.typeChartWindow = typeChartWindow;
module.exports.typeCalculatorWindow = typeCalculatorWindow;
module.exports.teamBuilderWindow = teamBuilderWindow;
module.exports.smogonWindow = smogonWindow;
module.exports.isOfflineMode = isOfflineMode;
module.exports.gameFilesDownloaded = gameFilesDownloaded;
module.exports.closeUtilityWindows = closeUtilityWindows;
module.exports.darkMode = darkMode;
module.exports.keymap = keymap;
module.exports.useModifiedHotkeys = useModifiedHotkeys;
module.exports.autoHideMenu = autoHideMenu;
module.exports.hideCursor = hideCursor;
module.exports.gameDir = gameDir;
module.exports.currentVersionPath = currentVersionPath;
module.exports.latestAppReleaseUrl = latestAppReleaseUrl;
module.exports.latestGameReleaseUrl = latestGameReleaseUrl;
module.exports.httpOptions = httpOptions;
module.exports.discordEnabled = discordEnabled;