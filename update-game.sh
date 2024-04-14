#!/bin/bash

echo "Checking for Git installation..."
if ! command -v git &> /dev/null
then
    echo "Git is not installed. Installing Git..."
    sudo apt-get update
    sudo apt-get install -y git
fi

echo "Checking for Node.js installation..."
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Installing Node.js..."
    curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Updating game files..."
node update-game.js
read -p "Press any key to continue..."