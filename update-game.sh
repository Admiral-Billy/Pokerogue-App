#!/bin/bash

echo "Checking for Git installation..."
if ! command -v git &> /dev/null
then
    echo "Git is not installed. Installing Git..."
    
    # Check if pacman is available
    if command -v pacman &> /dev/null
    then
        sudo pacman -Sy git
    else
        sudo apt-get update
        sudo apt-get install -y git
    fi
fi

echo "Checking for Node.js installation..."
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Installing Node.js..."

    # Check if pacman is available
    if command -v pacman &> /dev/null
    then
        sudo pacman -Sy nodejs npm
    else
        curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

echo "Updating game files..."
node update-game.js

echo "Press any key to continue..."
read -rsn1 _