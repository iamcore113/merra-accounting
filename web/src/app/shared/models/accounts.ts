export interface AccountItem {
  organizationID: string;
  accountID: string;
  code: string;
  accountName: string;
  accountType: string;
  category?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | string;
  entryType?: 'DEBIT' | 'CREDIT' | string;
  status?: 'ACTIVE' | 'ARCHIVED' | string;
  description?: string;
  taxType?: string;
  enablePaymentToAccount?: boolean;
  addToWatchList?: boolean;
  updatedDate?: string;
}

export interface AccountCategoryOption {
  id: string;
  name: string;
  entryType: string;
}

export interface AccountTypeOption {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface AccountMetadataResponse {
  categories: AccountCategoryOption[];
  accountTypes: AccountTypeOption[];
}

export interface AccountCodeExistsResponse {
  accountCode: string;
  exists: boolean;
}

export interface CreateAccountPayload {
  code: string;
  accountName: string;
  accountType: string;
  category: string;
  description: string;
  taxType?: string;
  enablePaymentToAccount?: boolean;
  addToWatchList?: boolean;
  status?: string;
}
