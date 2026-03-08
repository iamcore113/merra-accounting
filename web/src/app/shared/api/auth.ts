import { BASE_URL } from "./base";

// Authentication endpoints
const AUTH_URL = `${BASE_URL}auth`;
export const SIGNIN_URL = `${AUTH_URL}/signin`;
export const SIGNUP_URL = `${AUTH_URL}/signup`;
export const REQUEST_SIGNUP_VERIFICATION_EMAIL_URL = `${AUTH_URL}/req/signup/verify`;
export const RESEND_VERIFICATION_EMAIL_URL = `${AUTH_URL}/resend-verification-email`;
// Token endpoints
const TOKEN_URL = `${BASE_URL}token`;
export const REQUEST_USER = `${TOKEN_URL}/request/user/`;
export const TOKEN_VALIDATE_URL = `${TOKEN_URL}/validate`;
export const OBTAIN_NEW_TOKEN_URL = `${TOKEN_URL}/obtain/new`;
