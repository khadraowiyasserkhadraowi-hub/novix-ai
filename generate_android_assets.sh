#!/bin/bash
# Generate high-fidelity Android assets for Novix AI
ICON_SOURCE="src/assets/images/novix_app_icon_1783185001834.jpg"
RES_DIR="android/app/src/main/res"

if [ ! -f "$ICON_SOURCE" ]; then
  echo "Error: Source icon not found at $ICON_SOURCE"
  exit 1
fi

echo "Converting and resizing launcher icons..."

# mipmap-mdpi (48x48)
convert "$ICON_SOURCE" -resize 48x48\! "$RES_DIR/mipmap-mdpi/ic_launcher.png"
convert "$ICON_SOURCE" -resize 48x48\! "$RES_DIR/mipmap-mdpi/ic_launcher_round.png"
convert "$ICON_SOURCE" -resize 48x48\! "$RES_DIR/mipmap-mdpi/ic_launcher_foreground.png"

# mipmap-hdpi (72x72)
convert "$ICON_SOURCE" -resize 72x72\! "$RES_DIR/mipmap-hdpi/ic_launcher.png"
convert "$ICON_SOURCE" -resize 72x72\! "$RES_DIR/mipmap-hdpi/ic_launcher_round.png"
convert "$ICON_SOURCE" -resize 72x72\! "$RES_DIR/mipmap-hdpi/ic_launcher_foreground.png"

# mipmap-xhdpi (96x96)
convert "$ICON_SOURCE" -resize 96x96\! "$RES_DIR/mipmap-xhdpi/ic_launcher.png"
convert "$ICON_SOURCE" -resize 96x96\! "$RES_DIR/mipmap-xhdpi/ic_launcher_round.png"
convert "$ICON_SOURCE" -resize 96x96\! "$RES_DIR/mipmap-xhdpi/ic_launcher_foreground.png"

# mipmap-xxhdpi (144x144)
convert "$ICON_SOURCE" -resize 144x144\! "$RES_DIR/mipmap-xxhdpi/ic_launcher.png"
convert "$ICON_SOURCE" -resize 144x144\! "$RES_DIR/mipmap-xxhdpi/ic_launcher_round.png"
convert "$ICON_SOURCE" -resize 144x144\! "$RES_DIR/mipmap-xxhdpi/ic_launcher_foreground.png"

# mipmap-xxxhdpi (192x192)
convert "$ICON_SOURCE" -resize 192x192\! "$RES_DIR/mipmap-xxxhdpi/ic_launcher.png"
convert "$ICON_SOURCE" -resize 192x192\! "$RES_DIR/mipmap-xxxhdpi/ic_launcher_round.png"
convert "$ICON_SOURCE" -resize 192x192\! "$RES_DIR/mipmap-xxxhdpi/ic_launcher_foreground.png"

echo "Generating splash screen assets..."
# Splash screen drawable (1024x1024 or similar)
convert "$ICON_SOURCE" -resize 1024x1024\! "$RES_DIR/drawable/splash.png"

echo "All Android launcher and splash assets successfully generated!"
