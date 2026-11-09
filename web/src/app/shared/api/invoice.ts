import { BASE_URL } from "./base";

const INVOICE_ENDPOINT: string = `${BASE_URL}business/invoice/`;
export const INVOICE_METADATA_URL: string = `${INVOICE_ENDPOINT}metadata`;
export const CREATE_INVOICE_URL: string = `${INVOICE_ENDPOINT}new`;
export const CHECK_INVOICE_NUMBER_URL: string = `${INVOICE_ENDPOINT}check-invoice-number`;
export const ALL_INVOICES_URL: string = `${INVOICE_ENDPOINT}all`;
export const GET_INVOICE_BY_ID_URL = (id: string): string => `${INVOICE_ENDPOINT}${id}`;
