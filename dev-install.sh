#!/bin/bash

SANDBOX_DEST="/Users/vsun/Library/Mobile Documents/iCloud~md~obsidian/Documents/sandbox/.obsidian/plugins/obsidian-mov-support"
PROD_DEST="/Users/vsun/Library/Mobile Documents/iCloud~md~obsidian/Documents/vsun-icloud/.obsidian/plugins/obsidian-mov-support"
MOBILE_PROD_DEST="/Users/vsun/Library/Mobile Documents/iCloud~md~obsidian/Documents/vsun-icloud/.obsidian-ios/plugins/obsidian-mov-support"
GOOGLE_PROD_DEST="/Volumes/GoogleDrive/My Drive/Obsidian/vsun-google-drive/.obsidian/plugins/obsidian-mov-support"
# mkdir $DEST

#rsync -aE –delete . "/Users/vsun/Library/Mobile Documents/iCloud~md~obsidian/Documents/sandbox/.obsidian/plugins/obsidian-mov-support"

while getopts dpmg flag; do
    case "${flag}" in
    d) DEST=$SANDBOX_DEST ;;
    p) DEST=$PROD_DEST ;;
    m) DEST=$MOBILE_PROD_DEST ;;
    g) DEST=$GOOGLE_PROD_DEST ;;
    esac
done
echo "destination: $DEST"

[ -d "$DEST" ] || mkdir "$DEST"

cp main.js manifest.json styles.css "$DEST"
