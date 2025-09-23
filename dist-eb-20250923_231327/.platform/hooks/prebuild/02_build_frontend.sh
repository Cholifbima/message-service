#!/bin/bash
echo "Building React frontend..."

# Navigate to client directory and build
cd /var/app/staging/client
npm install
npm run build

# Move build files to public directory
cd /var/app/staging
mkdir -p public
cp -r client/build/* public/

echo "Frontend build completed successfully!"
