#!/bin/bash

# Build the frontend
npm run build

# The vercel.json file is read from the root, so it doesn't need to be moved.
# mv vercel.json dist/