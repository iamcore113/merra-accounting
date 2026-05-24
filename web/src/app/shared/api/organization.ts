import { BASE_URL } from "./base";

const ORGANIZATION_URL = `${BASE_URL}business/organization/`
const ORGANIZATION_USER_URL = `${BASE_URL}business/organization/user/`
const ORGANIZATION_METADATA = `${BASE_URL}metadata/organization/`
export const GET_ORGANIZATION_USER_BY_ID = `${ORGANIZATION_URL}users/`
export const CREATE_ORGANIZATION = `${ORGANIZATION_URL}new`
export const CURRENT_ORGANIZATION = `${ORGANIZATION_URL}current`
export const ORGANIZATION_METADATA_URL = ORGANIZATION_METADATA
export const AUTHENTICATED_USER_DETAILS = `${ORGANIZATION_USER_URL}details`
export const AUTHENTICATED_USER_UPDATE_PROFILE = `${ORGANIZATION_USER_URL}update`