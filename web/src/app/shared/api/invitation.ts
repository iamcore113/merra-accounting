import { BASE_URL } from './base';

export const INVITATION_BASE_URL = `${BASE_URL}business/organization/invitation/`;
export const CREATE_INVITATION_URL = `${INVITATION_BASE_URL}create`;
export const VERIFY_INVITATION_URL = `${INVITATION_BASE_URL}verify`;
export const ACCEPT_INVITATION_URL = `${INVITATION_BASE_URL}accept`;
export const REGISTER_AND_ACCEPT_INVITATION_URL = `${INVITATION_BASE_URL}register-and-accept`;
export const REVOKE_INVITATION_URL = (id: string) => `${INVITATION_BASE_URL}${id}`;
