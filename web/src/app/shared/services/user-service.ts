import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserPersonalInformationRequest } from '../models/user';
import { COMPLETE_PROFILE_URL } from '../api/user';
import { Observable } from 'rxjs';
import { Config } from '../models/api_response';
import { HttpContext } from '@angular/common/http';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { AUTHENTICATED_USER_DETAILS, AUTHENTICATED_USER_UPDATE_PROFILE } from '../api/organization';
import { PrincipalDetailsResponse } from '../models/organization';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private completeProfileUrl = COMPLETE_PROFILE_URL;

  personalInformation(req: UserPersonalInformationRequest): Observable<Config> {
    return this.http.post<Config>(this.completeProfileUrl, req, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  getAuthenticatedUserDetails(): Observable<Config> {
    return this.http.get<Config>(AUTHENTICATED_USER_DETAILS, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  updateProfile(req: PrincipalDetailsResponse): Observable<Config> {
    return this.http.put<Config>(AUTHENTICATED_USER_UPDATE_PROFILE, req, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }
}
