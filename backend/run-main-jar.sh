#!/bin/bash

set -euo pipefail

MAIN_DIR="/Users/briancore/Documents/workspace/merra-accounting/backend/main"
ENV_FILE="$MAIN_DIR/.env"
APPLICATION_DIR="$MAIN_DIR/application"
APPLICATION_JAR="$APPLICATION_DIR/main-1.0-SNAPSHOT.jar"
TARGET_JAR="$MAIN_DIR/target/main-1.0-SNAPSHOT.jar"

cd "$MAIN_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

if [[ -d "$APPLICATION_DIR" ]]; then
  if [[ ! -f "$APPLICATION_JAR" ]]; then
    echo "Error: application folder exists but JAR file not found at $APPLICATION_JAR"
    echo "Build it first with: cd /Users/briancore/Documents/workspace/merra-accounting/backend && ./mvnw -pl main -am clean package"
    exit 1
  fi
  RUN_FROM="application"
else
  if [[ ! -f "$TARGET_JAR" ]]; then
    echo "Error: JAR file not found at $TARGET_JAR"
    echo "Build it first with: cd /Users/briancore/Documents/workspace/merra-accounting/backend && ./mvnw -pl main -am clean package"
    exit 1
  fi
  RUN_FROM="target"
fi

set -a
source "$ENV_FILE"
set +a

if [[ "$RUN_FROM" == "application" ]]; then
  cd "$APPLICATION_DIR"
  echo "Starting AOT JAR: $APPLICATION_JAR"
  exec java -XX:AOTCache=app.aot -jar main-1.0-SNAPSHOT.jar
fi

echo "Starting JAR: $TARGET_JAR"
exec java -jar "$TARGET_JAR"
