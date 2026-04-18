#!/bin/bash

set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_DIR="$BACKEND_DIR/main"
ENV_FILE="$MAIN_DIR/.env"
APPLICATION_DIR="$BACKEND_DIR/application"
APPLICATION_JAR="$APPLICATION_DIR/main-1.0-SNAPSHOT.jar"
TARGET_JAR="$MAIN_DIR/target/main-1.0-SNAPSHOT.jar"
AOT_CACHE="$APPLICATION_DIR/app.aot"

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

# Extract the application folder if it is missing or the build JAR is newer than
# the previously extracted copy (i.e. a fresh build was produced).
if [[ ! -f "$APPLICATION_JAR" ]] || [[ "$TARGET_JAR" -nt "$APPLICATION_JAR" ]]; then
  echo "Extracting application to $APPLICATION_DIR ..."
  rm -rf "$APPLICATION_DIR"
  cd "$BACKEND_DIR"
  java -Djarmode=tools -jar "$TARGET_JAR" extract --destination application
fi

# Generate the JVM AOT cache if it is missing or if the application JAR is
# newer than the existing cache (cache becomes stale after a rebuild).
# -Dspring.aot.enabled=true activates Spring Boot's process-aot generated code
# so the cache captures the optimised startup paths, not the reflective ones.
if [[ ! -f "$AOT_CACHE" ]] || [[ "$APPLICATION_JAR" -nt "$AOT_CACHE" ]]; then
  echo "Generating AOT cache at $AOT_CACHE ..."
  cd "$APPLICATION_DIR"
  java -XX:AOTCacheOutput=app.aot \
       -Dspring.aot.enabled=true \
       -Dspring.context.exit=onRefresh \
       -jar main-1.0-SNAPSHOT.jar
fi

cd "$APPLICATION_DIR"
echo "Starting AOT JAR from $(pwd) ..."
exec java -XX:AOTCache=app.aot \
          -Dspring.aot.enabled=true \
          -jar main-1.0-SNAPSHOT.jar
