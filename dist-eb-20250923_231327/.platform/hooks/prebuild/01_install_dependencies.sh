#!/bin/bash
echo "Installing dependencies..."

# Install server dependencies
echo "Installing server dependencies..."
cd /var/app/staging/server && npm install

echo "Dependencies installed successfully!"
