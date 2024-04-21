# Pokerogue App
An app to play Pokerogue.net in an app window. Wow! Hit Alt and you can view a list of utilities as well as their shortcuts.. Offline mode can be ran by using the included bat/sh/command file, but requires the game files to be installed using the update script in the resources folder (which is also used to install https://www.pkmn.help for offline use). To find the resources folder on Mac you need to step into the actual App.

All cookie-related information can be found in %AppData%/Pokerogue; go there and delete the whole thing if you want the game to forget your login/settings/etc.

It's worth noting that if you're using the offline version startup will be slower, and performance will likely be worse due to running a server locally, so keep that in mind!

# Build instructions

Install NodeJS (https://nodejs.org/en)

Open a command prompt to the directory you stick this repo in

Install electron (npm install electron --save-dev) and the electron builder (npm install electron-builder --save-dev)

Run from command prompt with "npm start" or build the full app with "npm run build:platform". Each version has to be built from its own OS for it to work properly when zipped up (thanks Electron!)

Play! The app is found in dist/unpacked/Pokerogue.exe if you built it that way.
