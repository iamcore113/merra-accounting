// Authentication DTOs

// Corresponds to: backend/auth/src/main/java/org/merra/dto/CreateAccountRequest.java
export interface CreateAccountRequest {
  email: string;
  password: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/LoginRequest.java
export interface LoginRequest {
  email: string;
  password: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/JwtTokens.java
export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/AuthResponse.UserDetail
export interface UserDetail {
  userId: string;
  email: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/AuthResponse.java
export interface AuthResponse {
  token: JwtTokens;
  user: UserDetail;
  roles: string[];
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/VerifiedAccountResponse.java
export interface VerifiedAccountResponse {
  isVerified: boolean;
  email: string;
  temporaryAccessToken: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/VerificationResponse.VerificationToken
export interface VerificationToken {
  token: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/VerificationResponse.UserDetail
export interface VerificationUserDetail {
  userId: string;
  email: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/VerificationResponse.java
export interface VerificationResponse {
  resent: boolean;
  verificationToken: VerificationToken;
  userDetail: VerificationUserDetail;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/ResendEmailVerification.java
export interface ResendEmailVerification {
  userId: string;
}
