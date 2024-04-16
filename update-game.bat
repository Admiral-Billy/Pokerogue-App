@echo off
echo Checking for Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Git is not installed. Installing Git...
    winget install --id Git.Git -e --source winget
    if %errorlevel% neq 0 (
        echo Failed to install Git. Please install Git manually and try again.
        pause
        exit /b 1
    )
) else (
    echo Git is already installed.
)

echo Checking for Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Installing Node.js...
    winget install --id OpenJS.NodeJS -e --source winget
    if %errorlevel% neq 0 (
        echo Failed to install Node.js. Please install Node.js manually and try again.
        pause
        exit /b 1
    )
) else (
    echo Node.js is already installed.
)

echo Updating game files...
node update-game.js
pause