#!/bin/bash

# Build the frontend
npm run build

# Move vercel.json to the dist directory
mv vercel.json dist/