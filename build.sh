#!/bin/bash

# Note: This is intended to only be run in the Dockerfile.

# fail on unexpected errors
set -e

# configure directories. expects trailing slash.
ORIG_PATH=$(pwd)
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
        elif [[ $file != *.ts ]] && [[ $file != *.mts ]] && [[ $file != *.cts ]] && [[ $file != *.c ]]; then
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
cd "$ORIG_PATH"

# run emscripten
cd ./emsdk
git pull
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
cd ..
emcc -o ./dist/public/webasm/procmgr.js ./src/public/webasm/procmgr.c ./src/public/webasm/proclist.c -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=\$stringToNewUTF8,\$UTF8ToString -sEXPORTED_FUNCTIONS=_getFrames,_free -sNO_EXIT_RUNTIME=1 -sEXPORTED_RUNTIME_METHODS=ccall,cwrap
