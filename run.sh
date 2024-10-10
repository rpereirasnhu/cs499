#!/bin/bash

# no-build opt
if [[ $1 != -n ]]; then
    echo "Building..."
    ./build.sh
fi

# run compose
echo "Starting containers..."
docker compose up --build --pull always