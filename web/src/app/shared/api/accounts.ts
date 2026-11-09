import { BASE_URL } from './base';

const ACCOUNT_ENDPOINT: string = `${BASE_URL}business/account/`;
export const ALL_ACCOUNTS_URL: string = `${ACCOUNT_ENDPOINT}all`;
export const ACCOUNT_METADATA_URL: string = `${ACCOUNT_ENDPOINT}metadata`;
export const CHECK_ACCOUNT_CODE_URL: string = `${ACCOUNT_ENDPOINT}check-code`;
export const CREATE_ACCOUNT_URL: string = `${ACCOUNT_ENDPOINT}new`;
export const UPDATE_ACCOUNT_URL = (id: string): string => `${ACCOUNT_ENDPOINT}${id}`;
export const UPDATE_ACCOUNT_STATUS_URL = (id: string): string => `${ACCOUNT_ENDPOINT}${id}/status`;
