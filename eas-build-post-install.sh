#!/bin/bash
set -e

echo "--- eas-build-post-install ---"

# Ensure npm install succeeded
if [ ! -d "node_modules/react-native" ]; then
  echo "node_modules missing, re-running npm install..."
  npm install --legacy-peer-deps
fi

# Create android/node_modules symlink BEFORE expo prebuild runs.
# The expo-generated settings.gradle evaluates providers.exec { node ... }
# from the android/ directory. Node traversal checks android/node_modules/
# first — the symlink lets it find react-native without traversing up.
mkdir -p android
if [ ! -e "android/node_modules" ]; then
  ln -sfn "$(pwd)/node_modules" "android/node_modules"
  echo "Created android/node_modules -> $(pwd)/node_modules"
fi

echo "react-native found: $(node -e "console.log(require('react-native/package.json').version)")"
echo "--- done ---"
