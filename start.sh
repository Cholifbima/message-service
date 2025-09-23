#!/bin/bash

echo "🚀 Starting SQS Messaging Service..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install Node.js (v16 or higher) first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  Environment file not found. Copying from example..."
    cp server/config.example.env server/.env
    echo "📝 Please edit server/.env with your AWS credentials before running the app"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit server/.env with your AWS SQS credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For production deployment, check README.md for AWS deployment options."
echo ""
