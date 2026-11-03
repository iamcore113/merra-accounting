import { Injectable, inject } from '@angular/core';
import { CreateAccountRequest, LoginRequest, ResendEmailVerification } from '../models/auth';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, of } from 'rxjs';
import { Config } from '../models/api_response';
import {
  LOGOUT_URL,
  REQUEST_SIGNUP_VERIFICATION_EMAIL_URL,
  RESEND_VERIFICATION_EMAIL_URL,
  SIGNIN_URL,
  SIGNUP_URL,
  VERIFICATION_STATUS_URL,
} from '../api/auth';
import { LocalStorageService } from './local-storage-service';
import { Router } from '@angular/router';
import { IS_AUTHENTICATED } from '../context/auth.token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);

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

  resendVerificationEmail(request: ResendEmailVerification): Observable<Config> {
    return this.http.post<Config>(RESEND_VERIFICATION_EMAIL_URL, request);
  }

  checkVerificationStatus(email: string): Observable<Config> {
    const params = new HttpParams().set('email', email);
    return this.http.get<Config>(VERIFICATION_STATUS_URL, { params });
  }

  logout(): Observable<Config | null> {
    const refreshToken = this.localStorageService.getItem('refresh_token');
    const body = { refreshToken: refreshToken || '' };

    return this.http
      .post<Config>(LOGOUT_URL, body, {
        context: new HttpContext().set(IS_AUTHENTICATED, true),
      })
      .pipe(
        catchError((err) => {
          console.warn('Logout request failed or network unavailable:', err);
          return of(null);
        }),
        finalize(() => {
          this.clearSessionAndRedirect();
        })
      );
  }

  clearSessionAndRedirect(): void {
    this.localStorageService.removeItem('access_token');
    this.localStorageService.removeItem('refresh_token');
    this.router.navigate(['/account/signin']);
  }
}
