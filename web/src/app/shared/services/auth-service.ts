import { Injectable, inject } from '@angular/core';
import { CreateAccountRequest } from '../models/auth';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from '../models/api_response';
import { SIGNUP_URL } from '../api/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  signup(request: CreateAccountRequest): Observable<Config> {
    return this.http.post<Config>(SIGNUP_URL, request);
  }
}
