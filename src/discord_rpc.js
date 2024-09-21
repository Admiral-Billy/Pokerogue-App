const DiscordRPC = require('discord-rpc');

const globals = require("./globals");

let startTime = Date.now()
let adjustedPlayTime = 0;
let sessionStartTime = 0;
const intervalTimeout = 1000
function setup() {
  const clientId = '1232165629046292551';
  DiscordRPC.register(clientId);
  const rpc = new DiscordRPC.Client({
    transport: 'ipc'
  });

  rpc.on('ready', () => {
    console.log('Discord RPC connected.');
    clearInterval(globals.discordRPCConnectInterval)
    globals.discordRPCConnectInterval = undefined
    globals.discordRPCUpdateInterval = setInterval(updateDiscordPresence, intervalTimeout);
  });

  rpc.on('disconnected', () => {
    console.log('Discord RPC disconnected.');
    void retryDiscordRPCConnection()
  });

  rpc.login({ clientId }).catch(() => {
    void retryDiscordRPCConnection()
  })

  async function retryDiscordRPCConnection() {
    if (globals.discordRPCConnectInterval === undefined) {
      console.log('Discord Rich Presence is not available! Will retry every 1s.');
      globals.discordRPCConnectInterval = setInterval(setup, intervalTimeout)
    }
    clearInterval(globals.discordRPCUpdateInterval)
    globals.discordRPCUpdateInterval = undefined
  }

  async function updateDiscordPresence() {
    globals.mainWindow.webContents.executeJavaScript('window.gameInfo', true)
      .then((gameInfo) => {
        // Process the gameInfo data
        let gameData = gameInfo;

        // Check if the user is on the menu
        if (gameData.gameMode === 'Title') {
          adjustedPlayTime = -1;
          rpc.setActivity({
            details: 'On the menu',
            startTimestamp: startTime,
            largeImageKey: 'logo2',
            largeImageText: 'PokéRogue',
            instance: true,
          });
        } else {
          // Format the details string
          const details = `${gameData.gameMode} | Wave: ${gameData.wave} | ${gameData.biome}`;

          // Format the state string with the Pokemon list
          let state = `Party: ${gameData.party
            .map((pokemon) => `Lv. ${pokemon.level} ${pokemon.name}`)
            .join(', ')}`;

          if (state.length > 128) {
            state = state.substring(0, 125) + "...";
          }

          if (adjustedPlayTime === -1) {
            sessionStartTime = Date.now();
            adjustedPlayTime = gameData.playTime * 1000;
          }

          // Update the Rich Presence
          rpc.setActivity({
            details: details,
            state: state,
            startTimestamp: sessionStartTime - adjustedPlayTime,
            largeImageKey: gameData.biome ? gameData.biome.toLowerCase().replace(/\s/g, '_') + '_discord' : 'logo2',
            largeImageText: gameData.biome,
            smallImageKey: 'logo',
            smallImageText: 'PokéRogue',
            instance: true,
          });
        }
      })
      .catch(() => {
        // Fallback for non-existing code
        rpc.setActivity({
          startTimestamp: startTime,
          largeImageKey: 'logo2',
          largeImageText: 'PokéRogue',
          instance: true,
        });
      });
  }
}

module.exports.setup = setup;