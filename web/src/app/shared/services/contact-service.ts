import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ORGANIZATION_CONTACTS, CREATE_CONTACT, CHECK_CONTACT_ACCOUNT_NUMBER, CONTACT_DETAILS } from '../api/contacts';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { Config, SuccessResponse } from '../models/api_response';
import { CreateContactRequest, ContactAccountNumberExistsResponse, ContactDetailResponse, UpdateContactRequest } from '../models/contacts';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private readonly http = inject(HttpClient);

  getAllContacts(): Observable<Config> {
    return this.http.get<Config>(ORGANIZATION_CONTACTS, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  createContact(request: CreateContactRequest): Observable<Config> {
    return this.http.post<Config>(CREATE_CONTACT, request, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  checkAccountNumberExists(accountNumber: string): Observable<SuccessResponse<ContactAccountNumberExistsResponse>> {
    return this.http.get<SuccessResponse<ContactAccountNumberExistsResponse>>(CHECK_CONTACT_ACCOUNT_NUMBER, {
      params: { accountNumber },
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  getContactById(id: string): Observable<SuccessResponse<ContactDetailResponse>> {
    return this.http.get<SuccessResponse<ContactDetailResponse>>(CONTACT_DETAILS(id), {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  updateContact(id: string, request: UpdateContactRequest): Observable<SuccessResponse<ContactDetailResponse>> {
    return this.http.put<SuccessResponse<ContactDetailResponse>>(CONTACT_DETAILS(id), request, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  deleteContact(id: string): Observable<Config> {
    return this.http.delete<Config>(CONTACT_DETAILS(id), {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }
}
