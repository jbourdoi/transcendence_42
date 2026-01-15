#!/bin/bash
set -e

# get project directory name for volume name
PROJECT_DIR_NAME=$(basename "$(pwd)")
VOLUME_NAME="${PROJECT_DIR_NAME}_thanos-store-data"
VOLUME_DIR="/data/meta-syncer"
USER_ID="1001"
GROUP_ID="1001"

# Create the volume if it doesn't exist
docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1 || docker volume create "$VOLUME_NAME"

# Create directories and set permissions inside the volume
docker run --rm \
  -v "$VOLUME_NAME:/data" \
  alpine:3.20 \
  sh -c "
    mkdir -p /data/meta-syncer &&
    chown -R $USER_ID:$GROUP_ID /data &&
    chmod 750 /data
    "

echo "Initialized volume '$VOLUME_NAME' with correct permissions."