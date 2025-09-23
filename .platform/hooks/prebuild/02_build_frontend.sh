#!/bin/bash
echo "Building React frontend..."

# Navigate to client directory and build
cd client
npm run build

# Create symbolic link for static files
cd ..
ln -sf client/build public

echo "Frontend build completed successfully!"
