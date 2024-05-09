# PokeRogue App
An app to play Pokerogue.net in an app window. Wow! The app is playable in both online and offline mode. Online mode is the default, but you can switch to offline mode at any time by downloading the newest game files (file -> download) and then switching to offline (settings -> offline).

All cookie-related information can be found in %AppData%/Pokerogue; go there and delete the whole thing if you want the game to forget your login/settings/offline saves/etc.

The menu at the top has a list of utilities as well as their shortcuts, but they're also included here for your convenience:
Alt: Opens the menu bar that has the utilities tab, containing all of the below.  
Ctrl+R or F5: Soft resets the game, as if you relaunched it  
F11: Fullscreens the game  
F12: Developer console  
Ctrl+T: pkmn.help website (useful for being a type calculator and having a pokedex to access bulbapedia)  
Ctrl+Y: Type chart  
Ctrl+B: Team builder (useful for quickly seeing your team's resistances to various types, or planning)  
Ctrl+W: PokeRogue wiki  
Ctrl+D: Pokedex  
Ctrl+S: Smogon (to get a quick reference on what movesets might be good for a Pokemon, although of course take it with a grain of salt; PokeRogue is a different beast).  

# Build instructions

Install NodeJS (https://nodejs.org/en)

Open a command prompt to the directory you stick this repo in

Install electron (npm install electron --save-dev) and the electron builder (npm install electron-builder --save-dev)

Run from command prompt with "npm start" or build the full app with "npm run build:platform". Each version has to be built from its own OS for it to work properly when zipped up (thanks Electron!)

Play! The app is found in dist/unpacked/Pokerogue.exe if you built it that way.
