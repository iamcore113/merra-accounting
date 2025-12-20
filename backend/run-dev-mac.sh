#!/bin/bash

# --- 1. Define Environment Variables ---
export SPRING_APP_API_WEBSITE="https://restcountries.com/v3.1"
export DB_URL="jdbc:postgresql://localhost:5070/merradb"
export FRONTEND_URL="http://localhost:4200/"
export FRONTEND_REDIRECT_URL="http://localhost:4200/account/signup/oauth/google/success"
export VERIFICATION_TOKEN="86400000"
export JWT_ACCESS_TOKEN_DURATION="600000"
export JWT_REFRESH_TOKEN_EXPIRATION="5"
export JWT_TOKEN_SECRET="5da7abccd68264a5dadf70e16ccd2a48e5174651a08af2a366f8a28e39c88c0c"
export MAIL_HOST="smtp.gmail.com"
export MAIL_PORT="587"
export MAIL_DURATION="86400000"
export MAIL_USERNAME="iamcore113@gmail.com"
export MAIL_PASSWORD="hlqt rkwj uecm dtxh"

# --- 2. Run the Maven Command ---
echo "Starting Spring Boot application..."
./mvnw spring-boot:run -pl main