#!/bin/bash

echo "Checking for Git installation..."
if ! command -v git &> /dev/null
then
    echo "Git is not installed. Installing Git..."
    brew install git
fi

echo "Checking for Node.js installation..."
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Installing Node.js..."
    brew install node
fi

echo "Updating game files..."
cd "$(dirname "$0")"
node update-game.js
read -p "Press any key to continue..."