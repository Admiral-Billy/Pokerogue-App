# PokeRogue App
This is an app to play Pokerogue.net in an app window. Wow! 

The app is playable in both online and offline mode. Online mode is the default, but you can switch to offline mode at any time by downloading the newest game files (file -> download) and then switching to offline (settings -> offline). If you're on the Steam Deck and want to play in Gaming mode, add the "pokerogue" file (with no file extension) as a non-steam game and add `--no-sandbox` as a launch option and it'll work just fine (with touch screen required for the top menu stuff).

If offline file extraction seem to be taking a *very* long time (such as more than a minute), there's probably an antivirus such as Windows Defender slowing it down by scanning every small file individually; add an exception or disable it temporarily and see if that helps. A not responding message is normal on Windows.

For more information about the Android version, go here: https://github.com/Admiral-Billy/PokeRogue-App-Android

## Features
There's a variety of settings you can tweak to your choosing as well. The only thing to mention in particular is the modified hotkeys setting; there's a `keymap.json` in the resources folder that you can modify, and that'll affect what your hotkeys are (in the format of "Old" : "New", with the ability to bind multiple keys to the same other key if desired). It's not a perfect hotkey remapping since the hold behavior is off, but it should work for most purposes. A list of valid keys can be [found here](https://www.electronjs.org/docs/latest/api/accelerator)

All cookie-related information can be found in `%AppData%/Pokerogue`; go there and delete the whole thing if you want the game to forget your login/settings/offline saves/etc.

The menu at the top has a list of utilities as well as their shortcuts, but they're also included here for your convenience:
- Alt: Opens the menu bar that has the utilities tab, containing all of the below.  
- Ctrl+R or F5: Soft resets the game, as if you relaunched it  
- F11: Fullscreens the game  
- F12: Developer console  
- Ctrl+T: pkmn.help website (useful for being a type calculator and having a pokedex to access bulbapedia)  
- Ctrl+Y: Type chart
- Ctrl+H: Horizontal type chart (better for smaller screens)
- Ctrl+B: Team builder (useful for quickly seeing your team's resistances to various types, or planning)  
- Ctrl+W: PokeRogue wiki  
- Ctrl+D: Ydarissep's PokeRogue PokeDex (aka the RogueDex, huge credits to them for it existing!)
- Ctrl+S: Smogon (to get a quick reference on what movesets might be good for a Pokemon, although of course take it with a grain of salt; PokeRogue is a different beast).  

## Build instructions

- Clone this repository with git or download the source code as zip
- Install [NodeJS](https://nodejs.org/en)
- Open a command prompt to the directory you stick this repo in
- Install dependencies: `npm install` 
- Run from command prompt with `npm start` or build the full app with `npm run build:platform` (where platform is "win", "mac", or "linux").
  - Each version has to be built from its own OS for it to work properly when zipped up (thanks Electron!)

Now you're ready to play! The app is found in `dist/platform-unpacked/PokeRogue.exe` if you built it.

## Install instructions

### Windows/Mac/Non-Arch Linux
Simply extract the game's zip somewhere and run the executable. Windows has an installer that can be used as well, although be careful where you install it to; installing it to somewhere like Program Files may create permission issues that require running as admin to resolve.

### 🐧 Arch
For Arch Linux users, the application is available as an [AUR package](https://aur.archlinux.org/packages/pokerogue-app-bin). You can install it using an AUR helper like `yay`.

#### Using `yay`:
```sh
yay -S pokerogue-app-bin
```

Once installed, you can launch the application from your application menu or by running pokerogue from the terminal.

### Nix
For NixOs users, the application is available as a flake, just add this in your flake.nix and rebuild the system:
```nix
inputs.pokerogue-app.url = "github:Admiral-Billy/Pokerogue-App";
```
Then add the package in your config anywhere you pass 'pokerogue-app', for example in home-manager:
```nix
{ inputs, pkgs, pokerogue-app, ... }: {
  imports = [
  ];

  home.packages = with pkgs; [
    pokerogue-app.packages.x86_64-linux.pokerogue-app
  ];
#...config
}
```

### Android
Download the APK to your phone and then run it with a file manager, and this will install the app.
