import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ALL_CONTACTS } from '../api/contacts';
import { Config } from '../models/api_response';

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private http = inject(HttpClient);

  getAllContacts(): Observable<Config> {
    return this.http.get<Config>(ALL_CONTACTS);
  }

}
