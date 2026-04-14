#!/bin/bash

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_DIR="$BACKEND_DIR/main"
ENV_FILE="$MAIN_DIR/.env"
APPLICATION_DIR="$BACKEND_DIR/application"
APPLICATION_JAR="$APPLICATION_DIR/main-1.0-SNAPSHOT.jar"
TARGET_JAR="$MAIN_DIR/target/main-1.0-SNAPSHOT.jar"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

if [[ ! -f "$TARGET_JAR" ]]; then
  echo "Error: JAR file not found at $TARGET_JAR"
  echo "Build it first with: cd $BACKEND_DIR && ./mvnw -pl main -am clean package"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

# Extract the application folder to the backend root if not already done
if [[ ! -d "$APPLICATION_DIR" ]]; then
  echo "Extracting application to $APPLICATION_DIR ..."
  cd "$BACKEND_DIR"
  java -Djarmode=tools -jar "$TARGET_JAR" extract --destination application
fi

# Generate the AOT cache if missing
if [[ ! -f "$APPLICATION_DIR/app.aot" ]]; then
  echo "Generating AOT cache at $APPLICATION_DIR/app.aot ..."
  cd "$APPLICATION_DIR"
  java -XX:AOTCacheOutput=app.aot -Dspring.context.exit=onRefresh -jar main-1.0-SNAPSHOT.jar
fi

cd "$APPLICATION_DIR"
echo "Starting AOT JAR from $(pwd) ..."
exec java -XX:AOTCache=app.aot -jar main-1.0-SNAPSHOT.jar
