#!/bin/bash

# Create a .env file for the backend
echo "Creating backend .env file..."
echo "VITE_API_KEY=${VITE_API_KEY}" > backend/.env

# Build the frontend
echo "Building the frontend..."
npm run build

echo "Build script finished."