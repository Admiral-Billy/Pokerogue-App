const { Menu } = require('electron');
const { tabData: aboutTab_Data } = require("./about_tab");
const { tabData: settingsTab_Data} = require("./settings_tab");
const { tabData: utilitiesTab_Data} = require("./utilities_tab");
const { tabData: editTab_Data} = require("./edit_tab");
const { tabData: fileTab_Data } = require("./file_tab");
const globals = require("./globals");

function createMenu() {
    const menuTemplate = [
        fileTab_Data,
        settingsTab_Data,
        utilitiesTab_Data,
        editTab_Data,
        aboutTab_Data
    ];

    return Menu.buildFromTemplate(menuTemplate);
}

module.exports = {createMenu}