import { Injectable, inject } from '@angular/core';
import { CreateAccountRequest, LoginRequest } from '../models/auth';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Config } from '../models/api_response';
import { REQUEST_SIGNUP_VERIFICATION_EMAIL_URL, SIGNIN_URL, SIGNUP_URL } from '../api/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  signup(request: CreateAccountRequest): Observable<Config> {
    return this.http.post<Config>(SIGNUP_URL, request);
  }

  signin(request: LoginRequest): Observable<Config> {
    return this.http.post<Config>(SIGNIN_URL, request);
  }

  verifyAccount(token: string): Observable<Config> {
    const url = `${REQUEST_SIGNUP_VERIFICATION_EMAIL_URL}?token=${token}`;
    return this.http.get<Config>(url);
  }
  
}
