import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocalStorageService } from '../../services/localStorage/localStorage.service';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';
import { BYPASS_LOGGING } from '../../context/auth-context';
import { ValidateTokenResponse, RequestedTokensResponse } from '../../utils/types';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const ls = inject(LocalStorageService);
  const auth = inject(AuthService);

  if (req.context.get(BYPASS_LOGGING) === true) {
    // Pass the request through without modification
    return next(req);
  }
  
  const access_token: string | null = ls.getItem('access_token');
  console.log("Auth Interceptor running...");
  
  // Attach token if available
  let authReq = req;
  if (access_token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${access_token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        console.log('401 detected, attempting to refresh token...');
        return auth.refreshToken().pipe(
          switchMap((newTokens: any) => {
            if (newTokens && newTokens.accessToken) {
              // Retry the request with the new token
              const retryReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newTokens.accessToken}`
                }
              });
              return next(retryReq);
            }
            // If refresh failed, propagate the original error
            return of(error); // Or throwError(() => error) depending on desired behavior
          }),
          catchError((refreshErr) => {
            // If refresh logic throws an error, propagate it
             console.error('Refresh token failed in interceptor', refreshErr);
             // Optionally redirect to login here
             return of(error); 
          })
        );
      }
      // Propagate other errors
      throw error;
    })
  );
}
