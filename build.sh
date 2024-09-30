#!/bin/bash

# fail on unexpected errors
set -e

# configure directories. expects trailing slash.
SRC_PATH=$(pwd)/src/
OUT_PATH=$(pwd)/dist/

# prints file with spaces
# $1: intermediate path; $1: path depth
printFileName() {
    for i in $(seq 1 "$2"); do
        echo -n "|   "
    done
    echo "|-- $(basename "$1")"
}

# recursive copy function
# $1: intermediate path; $2: path depth
copyFiles() {
    for file in $1*; do
        if [[ -d $file ]]; then
            printFileName "$file" "$2"
            mkdir -p "${OUT_PATH}$file/"
            copyFiles "$file/" "$(($2 + 1))"
        elif [[ $file != *.ts ]] && [[ $file != *.mts ]] && [[ $file != *.cts ]]; then
            printFileName "$file" "$2"
            cp "${SRC_PATH}$file" "${OUT_PATH}$file"
        fi
    done
}

# remove current dist dir if exists
if [ -d "$OUT_PATH" ]; then
    echo "Removing current output directory..."
    rm -rf "$OUT_PATH"
fi

# install modules (if necessary)
npm i

# compile typescript
echo "Compiling TypeScript..."
npx tsc

# copy rest
echo "Copying other files..."
cd "$SRC_PATH"
echo "$(basename $OUT_PATH)"
copyFiles "" 0
