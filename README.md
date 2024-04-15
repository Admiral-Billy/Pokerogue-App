# Pokerogue App
 An app to play Pokerogue.net in an app window. Wow!

All cookie-related information can be found in %AppData%/Pokerogue; go there and delete the whole thing if you want the game to forget your login/settings/etc.

It's worth noting that if you're using the offline version (from the Offline-Mode branch) startup will be slower, and performance will likely be worse due to running a server locally, so keep that in mind!

Build instructions:

Install NodeJS (https://nodejs.org/en)

Open a command prompt to the directory you stick this repo in

Install electron (npm install electron --save-dev) and the electron packager (npm install electron-packager --save-dev)

Run from command prompt with "npm start" or build the full app with "npm run package:platform" (platform being either "win", "mac", or "linux" for Windows/Mac/Linux respectively).

Alternatively, try to use my WIP build script that will do all of these and bundle them into a zip (although it's a bit jank atm; I don't recommend it).

NOTE: Apparently you can't zip up the mac version if you're not on a mac, so I can't distribute this version at the moment myself.

Play! The app is found in dist/Pokerogue/Pokerogue.exe if you built it that way.
