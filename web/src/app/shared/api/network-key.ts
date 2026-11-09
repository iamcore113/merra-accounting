import { BASE_URL } from "./base";

export const NETWORK_KEY_BASE = `${BASE_URL}business/network-key/`;
export const GENERATE_NETWORK_KEY = `${NETWORK_KEY_BASE}generate`;
export const RESOLVE_NETWORK_KEY = `${NETWORK_KEY_BASE}resolve`;
export const DELETE_NETWORK_KEY = (id: string) => `${NETWORK_KEY_BASE}${id}`;
