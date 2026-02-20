// Authentication DTOs

export interface CreateAccountRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserDetail {
  userId: string;
  email: string;
}

export interface AuthResponse {
  token: JwtTokens;
  user: UserDetail;
  roles: string[];
}

export interface VerifiedAccountResponse {
  isVerified: boolean;
  email: string;
  temporaryAccessToken: string;
}

export interface VerificationToken {
  token: string;
}

export interface VerificationUserDetail {
  userId: string;
  email: string;
}

export interface VerificationResponse {
  resent: boolean;
  verificationToken: VerificationToken;
  userDetail: VerificationUserDetail;
}

export interface ResendEmailVerification {
  userId: string;
}
