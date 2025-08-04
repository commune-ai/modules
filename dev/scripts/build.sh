#!/bin/bash
# Build the Next.js application before starting

echo "Building Next.js application..."
cd /app

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the application
npm run build

echo "Build complete!"