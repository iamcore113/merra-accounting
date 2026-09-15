import { BASE_URL } from "./base";

const ORGANIZATION_URL: string = `${BASE_URL}business/organization/`
const ORGANIZATION_USER_URL: string = `${BASE_URL}business/organization/user/`
const ORGANIZATION_METADATA: string = `${BASE_URL}metadata/organization/`
export const GET_ORGANIZATION_USER_BY_ID: string = `${ORGANIZATION_URL}users/`
export const CREATE_ORGANIZATION: string = `${ORGANIZATION_URL}new`
export const CURRENT_ORGANIZATION: string = `${ORGANIZATION_URL}current`
export const CURRENT_ORGANIZATION_UPDATE: string = `${ORGANIZATION_URL}update`
export const ORGANIZATION_METADATA_URL: string = ORGANIZATION_METADATA
export const AUTHENTICATED_USER_DETAILS: string = `${ORGANIZATION_USER_URL}details`
export const AUTHENTICATED_USER_UPDATE_PROFILE: string = `${ORGANIZATION_USER_URL}update`