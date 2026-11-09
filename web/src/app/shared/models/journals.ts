export interface JournalLineItem {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  description?: string;
  debit?: number | null;
  credit?: number | null;
}

export interface JournalItem {
  journalId: string;
  journalNumber: number;
  journalDate: string;
  narration?: string;
  sourceType: 'INVOICE' | string;
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceType?: 'CUSTOMER' | 'SUPPLIER' | string;
  invoiceTypeName?: string;
  invoiceStatus?: string;
  contactName?: string;
  reference?: string;
  totalDebit: number;
  totalCredit: number;
  journalLines: JournalLineItem[];
}

export type JournalResponse = JournalItem;
