import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage-service';
import { IS_AUTHENTICATED } from '../context/auth.token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const requiresAuth = req.context.get(IS_AUTHENTICATED);
  const localStorage = inject(LocalStorageService);
  const router = inject(Router);

  const tempToken = localStorage.getItem('temp_token');
  if (!tempToken && requiresAuth) {
    // No token and auth required for the request - redirect to signin with message
    router.navigate(['/account/signin'], {
      queryParams: { message: 'Invalid token. Please login again.' }
    });
    return throwError(() => new Error('No authentication token found'));
  }

  if (tempToken && requiresAuth) {
    let headers = req.headers.set('Authorization', `Bearer ${tempToken}`);

    const authReq = req.clone({ headers });

    return next(authReq).pipe(
      catchError(error => {
        if (error.status === 401) {
          localStorage.removeItem('temp_token');
          // Token expired or invalid - redirect to signin
          router.navigate(['/account/signin'], {
            queryParams: { message: 'Token expired. Please login again.' }
          });
        }
        return throwError(() => error);
      })
    );
  }

  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        localStorage.removeItem('temp_token');
        router.navigate(['/account/signin'], {
          queryParams: { message: 'Authentication failed. Please login again.' }
        });
      }
      return throwError(() => error);
    })
  );
};
