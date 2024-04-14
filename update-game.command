#!/bin/bash
cd "$(dirname "$0")"
echo Downloading game files. Please wait.
node update-game.js
read -p "Press any key to continue..."