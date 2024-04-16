# Pokerogue App
An app to play Pokerogue.net in an app window. Wow! Ctrl+W pulls up the game's wiki page, and Ctrl+T pulls up a local version of https://www.pkmn.help (if installed). Offline mode can be ran by using the included bat/sh/command file, but requires the game files to be installed using the update script in the resources folder (which is also used to install https://www.pkmn.help).

All cookie-related information can be found in %AppData%/Pokerogue; go there and delete the whole thing if you want the game to forget your login/settings/etc.

It's worth noting that if you're using the offline version startup will be slower, and performance will likely be worse due to running a server locally, so keep that in mind!

# Build instructions

Install NodeJS (https://nodejs.org/en)

Open a command prompt to the directory you stick this repo in

Install electron (npm install electron --save-dev) and the electron packager (npm install electron-packager --save-dev)

Run from command prompt with "npm start" or build the full app with "npm run package:platform" or the build.sh script. Each version has to be built from its own OS for it to work properly when zipped up (thanks Electron!)

NOTE: Apparently you can't zip up the mac version if you're not on a mac, so I can't distribute this version at the moment myself.

Play! The app is found in dist/Pokerogue/Pokerogue.exe if you built it that way.
