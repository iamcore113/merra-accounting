# run-dev.ps1

# --- 1. Define Environment Variables (using $env: syntax) ---
$env:SPRING_APP_API_WEBSITE = "https://restcountries.com/v3.1"
$env:DB_URL = "jdbc:postgresql://localhost:5070/merradb"
$env:FRONTEND_URL = "http://localhost:4200/"
$env:FRONTEND_REDIRECT_URL = "http://localhost:4200/account/signup/oauth/google/success"
$env:VERIFICATION_TOKEN = "86400000"
$env:JWT_ACCESS_TOKEN_DURATION = "600000"
$env:JWT_REFRESH_TOKEN_EXPIRATION = "5"
$env:JWT_TOKEN_SECRET = "5da7abccd68264a5dadf70e16ccd2a48e5174651a08af2a366f8a28e39c88c0c"
$env:MAIL_HOST = "smtp.gmail.com"
$env:MAIL_PORT = "587"
$env:MAIL_DURATION = "86400000"
$env:MAIL_USERNAME = "iamcore113@gmail.com"
$env:MAIL_PASSWORD = "hlqt rkwj uecm dtxh" # Note: Quotes are not usually needed for $env: but are good practice.

# --- 2. Run the Maven Command ---
Write-Host "Starting Spring Boot application..."
.\mvnw spring-boot:run -pl main