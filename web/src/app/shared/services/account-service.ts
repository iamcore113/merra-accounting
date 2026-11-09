import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ALL_ACCOUNTS_URL,
  ACCOUNT_METADATA_URL,
  CHECK_ACCOUNT_CODE_URL,
  CREATE_ACCOUNT_URL,
  UPDATE_ACCOUNT_URL,
  UPDATE_ACCOUNT_STATUS_URL,
} from '../api/accounts';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { SuccessResponse } from '../models/api_response';
import {
  AccountCodeExistsResponse,
  AccountItem,
  AccountMetadataResponse,
  CreateAccountPayload,
} from '../models/accounts';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private readonly http = inject(HttpClient);

  getAllAccounts(): Observable<SuccessResponse<AccountItem[]>> {
    return this.http.get<SuccessResponse<AccountItem[]>>(ALL_ACCOUNTS_URL, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  getAccountMetadata(): Observable<SuccessResponse<AccountMetadataResponse>> {
    return this.http.get<SuccessResponse<AccountMetadataResponse>>(ACCOUNT_METADATA_URL, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  checkCodeExists(code: string): Observable<SuccessResponse<AccountCodeExistsResponse>> {
    return this.http.get<SuccessResponse<AccountCodeExistsResponse>>(CHECK_ACCOUNT_CODE_URL, {
      params: { code },
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  createAccount(payload: CreateAccountPayload): Observable<SuccessResponse<AccountItem>> {
    return this.http.post<SuccessResponse<AccountItem>>(CREATE_ACCOUNT_URL, payload, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  updateAccount(id: string, payload: CreateAccountPayload): Observable<SuccessResponse<AccountItem>> {
    return this.http.put<SuccessResponse<AccountItem>>(UPDATE_ACCOUNT_URL(id), payload, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  updateAccountStatus(id: string, status: string): Observable<SuccessResponse<AccountItem>> {
    return this.http.patch<SuccessResponse<AccountItem>>(UPDATE_ACCOUNT_STATUS_URL(id), null, {
      params: { status },
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }
}
