import { BASE_URL } from './base';

const JOURNAL_ENDPOINT: string = `${BASE_URL}business/journal/`;
export const ALL_JOURNALS_URL: string = `${JOURNAL_ENDPOINT}all`;
export const GET_JOURNAL_BY_ID_URL = (id: string): string => `${JOURNAL_ENDPOINT}${id}`;
export const GET_JOURNALS_BY_INVOICE_ID_URL = (invoiceId: string): string =>
  `${JOURNAL_ENDPOINT}invoice/${invoiceId}`;
