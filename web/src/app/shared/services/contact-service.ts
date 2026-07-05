import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ORGANIZATION_CONTACTS } from '../api/contacts';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { Config } from '../models/api_response';

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
}
