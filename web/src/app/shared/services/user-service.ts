import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { UserPersonalInformationRequest } from '../models/user';
import { COMPLETE_PROFILE_URL } from '../api/user';
import { Observable, tap } from 'rxjs';
import { Config } from '../models/api_response';
import { IS_AUTHENTICATED } from '../context/auth.token';
import {
  AUTHENTICATED_USER_DETAILS,
  AUTHENTICATED_USER_UPDATE_PROFILE,
  AUTHENTICATED_USER_PROFILE_IMAGE,
} from '../api/organization';
import { PrincipalDetailsResponse } from '../models/organization';
import { LocalStorageService } from './local-storage-service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private localStorage = inject(LocalStorageService);
  private completeProfileUrl = COMPLETE_PROFILE_URL;

  readonly isAccountUnverified = signal<boolean>(
    this.localStorage.getItem('account_unverified') === 'true'
  );

  setAccountUnverified(unverified: boolean): void {
    this.isAccountUnverified.set(unverified);
    if (unverified) {
      this.localStorage.setItem('account_unverified', 'true');
    } else {
      this.localStorage.removeItem('account_unverified');
    }
  }

  personalInformation(req: UserPersonalInformationRequest): Observable<Config> {
    return this.http.post<Config>(this.completeProfileUrl, req, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  getAuthenticatedUserDetails(): Observable<Config> {
    return this.http.get<Config>(AUTHENTICATED_USER_DETAILS, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    }).pipe(
      tap((res: any) => {
        if (res?.success && res?.data) {
          const details = res.data as PrincipalDetailsResponse;
          const enabled = details.isEnabled ?? details.enabled;
          if (typeof enabled === 'boolean') {
            this.setAccountUnverified(!enabled);
          }
        }
      })
    );
  }

  updateProfile(req: PrincipalDetailsResponse): Observable<Config> {
    return this.http.put<Config>(AUTHENTICATED_USER_UPDATE_PROFILE, req, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  uploadProfileImage(file: File): Observable<Config> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Config>(AUTHENTICATED_USER_PROFILE_IMAGE, formData, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  getProfileImage(): Observable<Blob> {
    return this.http.get(AUTHENTICATED_USER_PROFILE_IMAGE, {
      responseType: 'blob',
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  deleteProfileImage(): Observable<Config> {
    return this.http.delete<Config>(AUTHENTICATED_USER_PROFILE_IMAGE, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }
}
