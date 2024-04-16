#!/bin/bash

# Function to create a ZIP file
create_zip() {
  local platform=$1
  local folder_name=$2
  local zip_name="PokeRogue-$platform.zip"

  echo "Creating ZIP file for $platform..."
  cd "dist/$folder_name"
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Running on Windows
    if [ -f "../$zip_name" ]; then
      # Delete existing ZIP file
      rm "../$zip_name"
    fi
    # Compress using PowerShell
    powershell -Command "Compress-Archive -Path * -DestinationPath '../$zip_name' -Force"
  else
    # Running on macOS or Linux
    zip -r "../$zip_name" * -f
  fi
  cd "../.."
  echo "ZIP file created: dist/$zip_name"
}

# Build for Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
	echo "Building for Windows..."
	npm run package:win
	if [ $? -ne 0 ]; then
	  echo "Error building for Windows. Please check the error messages."
	  read -p "Press any key to continue..."
	  exit 1
	fi
else
  echo "Skipping ZIP creation for Windows on non-Windows platform."
fi

# Build for Linux
echo "Building for Linux..."
npm run package:linux
if [ $? -ne 0 ]; then
  echo "Error building for Linux. Please check the error messages."
  read -p "Press any key to continue..."
  exit 1
else
  echo "Skipping ZIP creation for Linux on non-Linux platform."
fi

# Build for macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
	echo "Building for macOS..."
	npm run package:mac
	if [ $? -ne 0 ]; then
	  echo "Error building for macOS. Please check the error messages."
	  read -p "Press any key to continue..."
	  exit 1
	fi
fi

# Create ZIP files for each build
create_zip "Windows" "Pokerogue-win32-x64"
create_zip "Linux" "Pokerogue-linux-x64"

# Create ZIP file for macOS only if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  create_zip "macOS" "Pokerogue-darwin-x64"
else
  echo "Skipping ZIP creation for macOS on non-macOS platform."
fi

echo "Build and packaging complete!"
read -p "Press any key to continue..."