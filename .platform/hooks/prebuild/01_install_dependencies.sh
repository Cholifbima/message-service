#!/bin/bash
echo "Installing all dependencies..."

# Install root dependencies
npm install

# Install server dependencies
echo "Installing server dependencies..."
cd server && npm install && cd ..

# Install client dependencies
echo "Installing client dependencies..."
cd client && npm install && cd ..

echo "All dependencies installed successfully!"
