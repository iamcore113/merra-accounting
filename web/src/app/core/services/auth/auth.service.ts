import { Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BASE_API_URL, AUTHENTICATION_API_VER1,
  AUTH_SIGNIN, AUTH_SIGNUP,
  VERIFY_EMAIL, OAUTH_CALLBACK,
  OAUTH_LINK, RESEND_EMAIL_VERIFICATION,
  USER_ENDPOINT_VER1, FILL_USER_PERSONAL_INFO
} from '../../utils/api';
import { Config, CreateAccount, resendEmailVerification, FillUserPersonalInformation } from '../../utils/types';
import { LocalStorageService } from '../localStorage/localStorage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly signup_url = `${AUTHENTICATION_API_VER1}${AUTH_SIGNUP}`;
  readonly oauth_link_url = `${BASE_API_URL}${OAUTH_LINK}`;
  readonly oath_redirect_url = `${BASE_API_URL}${OAUTH_CALLBACK}`;
  readonly USER_PERSONAL_INFO_URL = `${USER_ENDPOINT_VER1}${FILL_USER_PERSONAL_INFO}`;
  readonly EMAIL_VERIFICATION_URL = `${AUTHENTICATION_API_VER1}${VERIFY_EMAIL}`;
  readonly RESEND_EMAIL_VERIFICATION_URL = `${AUTHENTICATION_API_VER1}${RESEND_EMAIL_VERIFICATION}`;
  readonly googleIcon = 'https://www.svgrepo.com/show/475656/google-color.svg';

  constructor(private _http: HttpClient, private localStorageService: LocalStorageService) { }

  get GoogleIcon(): string {
    return this.googleIcon;
  }

  resendEmailVerification(res: resendEmailVerification): Observable<Config> {
    return this._http.post<Config>(this.RESEND_EMAIL_VERIFICATION_URL, res);
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
    return this._http.post<Config>(this.signup_url, res);
  }
  verifyEmail(token: string) {
    return this._http.get(this.EMAIL_VERIFICATION_URL, {params: {token: token}});
  }

  userPersonalInformation(res: FillUserPersonalInformation): Observable<Config> {
    return this._http.post<Config>(this.USER_PERSONAL_INFO_URL, res);
  }
}
