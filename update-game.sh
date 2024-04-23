#!/bin/bash

echo "Checking for Git installation..."
if ! command -v git &> /dev/null
then
    echo "Git is not installed. Installing Git..."
    
    # Check if apt is available
    if command -v apt-get &> /dev/null
    then
        sudo apt-get update
        sudo apt-get install -y git
    else
        sudo pacman -Sy git
    fi
fi

echo "Checking for Node.js installation..."
if ! command -v node &> /dev/null
then
    echo "Node.js is not installed. Installing Node.js..."

    # Check if apt is available
    if command -v apt-get &> /dev/null
    then
        curl -sL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        sudo pacman -Sy nodejs npm
    fi
fi

echo "Updating game files..."
node update-game.js

echo "Press any key to continue..."
stty raw -echo
any_key=$(dd bs=1 count=1 2>/dev/null)
stty -raw echo