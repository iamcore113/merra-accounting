import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageService } from '../services/local-storage-service';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { SessionExpiredDialog } from '../components/session-expired-dialog/session-expired-dialog';
import { API_VERSION } from '../api/base';

let sessionDialogOpen = false;

function openSessionExpiredDialog(dialog: MatDialog, message: string): void {
  if (sessionDialogOpen) {
    return;
  }
  sessionDialogOpen = true;
  dialog.open(SessionExpiredDialog, {
    width: '420px',
    disableClose: true,
    data: { message },
  }).afterClosed().subscribe(() => {
    sessionDialogOpen = false;
  });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const requiresAuth = req.context.get(IS_AUTHENTICATED);
  const localStorageService = inject(LocalStorageService);
  const dialog = inject(MatDialog);

  let headers = req.headers.set('API-Version', API_VERSION);

  const accessToken = localStorageService.getItem('access_token');
  if (!accessToken && requiresAuth) {
    localStorageService.removeItem('access_token');
    openSessionExpiredDialog(dialog, 'Your session is invalid or has expired. Please sign in again to continue.');
    return throwError(() => new Error('No authentication token found'));
  }

  if (accessToken && requiresAuth) {
    headers = headers.set('Authorization', `Bearer ${accessToken}`);
    const authReq = req.clone({ headers });

    return next(authReq).pipe(
      catchError(error => {
        if (error.status === 401) {
          localStorageService.removeItem('access_token');
          openSessionExpiredDialog(dialog, 'Your session token has expired or is no longer valid. Please sign in again to continue.');
        }
        return throwError(() => error);
      })
    );
  }

  const versionedReq = req.clone({ headers });
  return next(versionedReq).pipe(
    catchError(error => {
      if (error.status === 401) {
        localStorageService.removeItem('access_token');
        openSessionExpiredDialog(dialog, 'Authentication failed. Your session may have expired. Please sign in again.');
      }
      return throwError(() => error);
    })
  );
};
