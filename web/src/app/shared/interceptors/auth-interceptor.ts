import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpBackend, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';
import { LocalStorageService } from '../services/local-storage-service';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { SessionExpiredDialog } from '../components/session-expired-dialog/session-expired-dialog';
import { API_VERSION } from '../api/base';
import { OBTAIN_NEW_TOKEN_URL } from '../api/auth';
import { SuccessResponse } from '../models/api_response';
import { JwtTokens } from '../models/auth';

let sessionDialogOpen = false;
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

function openSessionExpiredDialog(dialogService: DialogService, message: string): void {
  if (sessionDialogOpen) {
    return;
  }
  sessionDialogOpen = true;
  const ref = dialogService.open(SessionExpiredDialog, {
    header: 'Session Expired',
    width: '420px',
    closable: false,
    closeOnEscape: false,
    modal: true,
    data: { message },
  });

  if (ref) {
    ref.onClose.subscribe(() => {
      sessionDialogOpen = false;
    });
  }
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  httpBackend: HttpBackend,
  localStorageService: LocalStorageService,
  dialogService: DialogService
): Observable<HttpEvent<unknown>> {
  if (req.url.includes('/tokens/obtain/new')) {
    isRefreshing = false;
    localStorageService.removeItem('access_token');
    localStorageService.removeItem('refresh_token');
    openSessionExpiredDialog(dialogService, 'Your session token has expired or is no longer valid. Please sign in again to continue.');
    return throwError(() => new Error('Session expired'));
  }

  const refreshToken = localStorageService.getItem('refresh_token');
  if (!refreshToken) {
    localStorageService.removeItem('access_token');
    localStorageService.removeItem('refresh_token');
    openSessionExpiredDialog(dialogService, 'Your session token has expired or is no longer valid. Please sign in again to continue.');
    return throwError(() => new Error('No refresh token available'));
  }

  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const rawHttp = new HttpClient(httpBackend);
    return rawHttp.post<SuccessResponse<JwtTokens>>(OBTAIN_NEW_TOKEN_URL, { token: refreshToken }).pipe(
      switchMap(response => {
        isRefreshing = false;
        const newAccessToken = response?.data?.accessToken;
        const newRefreshToken = response?.data?.refreshToken;
        if (newAccessToken) {
          localStorageService.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            localStorageService.setItem('refresh_token', newRefreshToken);
          }
          refreshTokenSubject.next(newAccessToken);
          const retriedReq = req.clone({
            headers: req.headers.set('Authorization', `Bearer ${newAccessToken}`)
          });
          return next(retriedReq);
        }
        throw new Error('Failed to refresh access token');
      }),
      catchError(refreshError => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        localStorageService.removeItem('access_token');
        localStorageService.removeItem('refresh_token');
        openSessionExpiredDialog(dialogService, 'Your session token has expired or is no longer valid. Please sign in again to continue.');
        return throwError(() => refreshError);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        const retriedReq = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`)
        });
        return next(retriedReq);
      })
    );
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const requiresAuth = req.context.get(IS_AUTHENTICATED);
  const localStorageService = inject(LocalStorageService);
  const dialogService = inject(DialogService);
  const httpBackend = inject(HttpBackend);

  let headers = req.headers.set('API-Version', API_VERSION);

  const accessToken = localStorageService.getItem('access_token');
  if (!accessToken && requiresAuth) {
    localStorageService.removeItem('access_token');
    openSessionExpiredDialog(dialogService, 'Your session is invalid or has expired. Please sign in again to continue.');
    return throwError(() => new Error('No authentication token found'));
  }

  if (accessToken && requiresAuth) {
    headers = headers.set('Authorization', `Bearer ${accessToken}`);
    const authReq = req.clone({ headers });

    return next(authReq).pipe(
      catchError(error => {
        if (error.status === 401) {
          return handle401(authReq, next, httpBackend, localStorageService, dialogService);
        }
        return throwError(() => error);
      })
    );
  }

  const versionedReq = req.clone({ headers });
  return next(versionedReq);
};
