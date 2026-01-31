export const BASE_API_URL = "http://localhost:8080/";
export const VERSION_1 = "api/v1/";
export const VER1_API = `${BASE_API_URL}${VERSION_1}`;
export const API_AUTH = `${VERSION_1}auth/`;
export const API_VERSION_1 = `${BASE_API_URL}${VERSION_1}`;
export const AUTHENTICATION_API_VER1 = `${BASE_API_URL}${API_AUTH}`;

// Mapping urls
// Organization
export const ORGANIZATION_MAPPING = 'business/organization/';
export const METADATA_ENDPOINT_VER1 = `${API_VERSION_1}metadata/`;
export const META_DATA_ORGANIZATION = 'organization/';
export const CREATE_NEW_ORGANIZATION = `${API_VERSION_1}${ORGANIZATION_MAPPING}create/`;
export const USER_ORGANIZATIONS = `${API_VERSION_1}${ORGANIZATION_MAPPING}users/`;
// authentications
export const AUTH_SIGNIN = "signin";
export const AUTH_SIGNUP = "signup";
export const VERIFY_EMAIL = "req/signup/verify";
export const VERIFY_EMAIL_V1 = `${API_AUTH}${VERIFY_EMAIL}`;
export const RESEND_EMAIL_VERIFICATION = "resend/verification/email";
// tokens
const TOKENS = "tokens/";
export const REQUEST_TOKENS = `${TOKENS}request/user/`;
export const OBTAIN_NEW_TOKENS = `${TOKENS}obtain/new`;
export const VALIDATE_TOKEN = `${TOKENS}validate`;
// User details
export const USER_ENDPOINT_VER1 = `${API_VERSION_1}account/user/`;
export const COMPLETE_USER_PERSONAL_INFO = "complete/profile";
// Oauth2
export const OAUTH_LINK = "auth/url";
export const OAUTH_CALLBACK = "auth/callback";
