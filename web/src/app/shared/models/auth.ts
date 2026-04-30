// Authentication DTOs

// Corresponds to: backend/auth/src/main/java/org/merra/dto/CreateAccountRequest.java
export interface CreateAccountRequest {
  email: string;
  gender: string;
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

// Corresponds to: backend/auth/src/main/java/org/merra/dto/VerifiedAccountResponse.java
export interface VerifiedAccountResponse {
  isVerified: boolean;
  userId: string;
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

// Corresponds to: backend/auth/src/main/java/org/merra/dto/FillPersonalInformation.java
export interface FillPersonalInformation {
  firstName: string;
  lastName: string;
  profile: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/ValidateTokenRequest.java
export interface ValidateTokenRequest {
  token: string;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/ValidateTokenResponse.java
export interface ValidateTokenResponse {
  isValid: boolean;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/SigninResponse.java
export interface SigninResponse {
  tokens: JwtTokens;
  accountStatus: AccountStatus;
  userdetails: Userdetails;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/SigninResponse.AccountStatus
interface AccountStatus {
  isComplete: boolean;
  partOfOrganization: boolean;
  isEnabled: boolean;
}

// Corresponds to: backend/auth/src/main/java/org/merra/dto/SigninResponse.Userdetails
interface Userdetails {
  userId: string;
  email: string;
  roles: string[];
}
