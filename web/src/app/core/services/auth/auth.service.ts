import { Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BASE_API_URL, AUTHENTICATION_API_VER1,
  AUTH_SIGNIN, AUTH_SIGNUP, REQUEST_TOKENS,
  VERIFY_EMAIL, OAUTH_CALLBACK,
  OAUTH_LINK, RESEND_EMAIL_VERIFICATION,
  USER_ENDPOINT_VER1, COMPLETE_USER_PERSONAL_INFO,
  API_VERSION_1,
  VALIDATE_TOKEN,
  OBTAIN_NEW_TOKENS,
  VER1_API
} from '../../utils/api';
import { Config, CreateAccount, resendEmailVerification, FillUserPersonalInformation, RequestedTokensResponse } from '../../utils/types';
import { LocalStorageService } from '../localStorage/localStorage.service';
import { BYPASS_LOGGING } from '../../context/auth-context';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly tokenValidateUrl = `${API_VERSION_1}${VALIDATE_TOKEN}`;
  readonly obtainNewTokensUrl = `${API_VERSION_1}${OBTAIN_NEW_TOKENS}`;
  readonly signup_url = `${AUTHENTICATION_API_VER1}${AUTH_SIGNUP}`;
  readonly oauth_link_url = `${BASE_API_URL}${OAUTH_LINK}`;
  readonly oath_redirect_url = `${BASE_API_URL}${OAUTH_CALLBACK}`;
  readonly USER_PERSONAL_INFO_URL = `${USER_ENDPOINT_VER1}${COMPLETE_USER_PERSONAL_INFO}`;
  readonly EMAIL_VERIFICATION_URL = `${AUTHENTICATION_API_VER1}${VERIFY_EMAIL}`;
  readonly RESEND_EMAIL_VERIFICATION_URL = `${AUTHENTICATION_API_VER1}${RESEND_EMAIL_VERIFICATION}`;
  readonly googleIcon = 'https://www.svgrepo.com/show/475656/google-color.svg';

  constructor(private _http: HttpClient, private localStorageService: LocalStorageService) { }

  get GoogleIcon(): string {
    return this.googleIcon;
  }

  resendEmailVerification(res: resendEmailVerification): Observable<Config> {
    return this._http.post<Config>(this.RESEND_EMAIL_VERIFICATION_URL, res, {
      context: new HttpContext().set(BYPASS_LOGGING, true)
    });
  }

  getOauthLink(): Observable<Config> {
    return this._http.get<Config>(this.oauth_link_url);
  }

  getOauthToken(code: string): Observable<Config> {
    return this._http.get<Config>(this.oath_redirect_url, {
      params: {
        code: code
      }
    });
  }

  signup(res: CreateAccount): Observable<Config> {
    return this._http.post<Config>(this.signup_url, res, {
      context: new HttpContext().set(BYPASS_LOGGING, true)
    });
  }
  verifyEmail(token: string) {
    return this._http.get(this.EMAIL_VERIFICATION_URL, {
      params: {token: token},
      context: new HttpContext().set(BYPASS_LOGGING, true)
    });
  }

  userPersonalInformation(res: FillUserPersonalInformation): Observable<Config> {
    return this._http.post<Config>(this.USER_PERSONAL_INFO_URL, res);
  }

  getTokens(): boolean {
    const token = this.localStorageService.getItem('access_token');
    return !!token;
  }
  validateToken(token: string) {
    console.log(`Validate token: ${token} URL: ${this.tokenValidateUrl}`);
    return this._http.post<Config>(this.tokenValidateUrl, {token: token});
  }

  obtainNewTokens(token: string) {
    return this._http.post<Config>(this.obtainNewTokensUrl, {token: token}, {
      context: new HttpContext().set(BYPASS_LOGGING, true)
    });
  }

  refreshToken(): Observable<RequestedTokensResponse | null> {
    const refreshToken = this.localStorageService.getItem('refresh_token');
    console.log(`Get refresh token ${refreshToken}`);
    if (!refreshToken) {
      return new Observable(observer => {
        observer.next(null);
        observer.complete();
      });
    }

    return new Observable(observer => {
      this.obtainNewTokens(refreshToken).subscribe({
        next: (res: any) => {
          const newTokens = res.data as RequestedTokensResponse;
          this.localStorageService.setItem('access_token', newTokens.accessToken);
          this.localStorageService.setItem('refresh_token', newTokens.refreshToken);
          observer.next(newTokens);
          observer.complete();
        },
        error: (err) => {
          console.error('Failed to refresh token', err);
          this.localStorageService.removeItem('access_token');
          this.localStorageService.removeItem('refresh_token');
          observer.next(null);
          observer.complete();
        }
      });
    });
  }

  requestTokens(): void {
    let tokens: RequestedTokensResponse;
    const userId = this.localStorageService.getItem('user_id');
    const url = `${VER1_API}${REQUEST_TOKENS}${userId}`;
    this._http.get<Config>(url, {context: new HttpContext().set(BYPASS_LOGGING, true)}).subscribe({
      next: (res: any) => {
        console.log('Tokens fetched successfully:');
        tokens = res.data as RequestedTokensResponse;
      },
      error: (err) => {
        console.error('Error fetching tokens:', err);
      },
      complete: () => {
        this.localStorageService.setItem('access_token', tokens.accessToken);
        this.localStorageService.setItem('refresh_token', tokens.refreshToken);
        console.log('Tokens stored in local storage.');
      }
    });
  }
}
