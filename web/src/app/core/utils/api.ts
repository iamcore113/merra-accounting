export const BASE_API_URL = "http://localhost:8080/";
export const VERSION_1 = "api/v1/";
export const API_AUTH = "api/auth/";
export const API_VERSION_1 = `${BASE_API_URL}${VERSION_1}`;
export const AUTHENTICATION_API_VER1 = `${BASE_API_URL}${API_AUTH}`;

// Mapping urls
// Metadatas
export const METADATA_ENDPOINT_VER1 = `${API_VERSION_1}metadata/`;
export const META_DATA_ORGANIZATION = 'organization';
// authentications
export const AUTH_SIGNIN = "signin";
export const AUTH_SIGNUP = "signup";
export const VERIFY_EMAIL = "req/signup/verify";
export const VERIFY_EMAIL_V1 = `${API_AUTH}${VERIFY_EMAIL}`;
export const RESEND_EMAIL_VERIFICATION = "resend/verification/email";
// User details
export const USER_ENDPOINT_VER1 = `${API_VERSION_1}account/user/`;
export const FILL_USER_PERSONAL_INFO = "fill/personal-information"
// Oauth2
export const OAUTH_LINK = "auth/url";
export const OAUTH_CALLBACK = "auth/callback";
// Organization
export const ORGANIZATION_MAPPING = 'business/organization/';
