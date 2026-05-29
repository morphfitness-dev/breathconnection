#!/bin/bash
set -e

echo "--- eas-build-post-install: verifying node_modules ---"

if [ ! -d "node_modules/@react-native/gradle-plugin" ]; then
  echo "WARNING: @react-native/gradle-plugin not found, running npm install..."
  npm install --legacy-peer-deps
fi

if [ ! -d "node_modules/expo" ]; then
  echo "WARNING: expo not found, running npm install..."
  npm install --legacy-peer-deps
fi

echo "node_modules/@react-native/gradle-plugin: OK"
echo "node_modules/expo: OK"
echo "--- post-install complete ---"
