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
  const refresh_token: string | null = ls.getItem('refresh_token');

  if (access_token) {
    return auth.validateToken(access_token).pipe(
      switchMap((res: any) => {
        const data = res.data as ValidateTokenResponse;
        if (data && data.isValid) {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${access_token}`
            }
          });
          return next(req);
        } else {
          // Access token invalid, check refresh token
          if (refresh_token) {
            return auth.validateToken(refresh_token).pipe(
              switchMap((refreshRes: any) => {
                const refreshData = refreshRes.data as ValidateTokenResponse;
                if (refreshData && refreshData.isValid) {
                  // Refresh token valid, obtain new tokens
                  return auth.obtainNewTokens(refresh_token).pipe(
                    switchMap((newTokensRes: any) => {
                      const newTokens = newTokensRes.data as RequestedTokensResponse;
                      ls.setItem('access_token', newTokens.accessToken);
                      ls.setItem('refresh_token', newTokens.refreshToken);
                      req = req.clone({
                        setHeaders: {
                          Authorization: `Bearer ${newTokens.accessToken}`
                        }
                      });
                      return next(req);
                    }),
                    catchError((err) => {
                      console.error('Failed to obtain new tokens:', err);
                      return next(req);
                    })
                  );
                }
                return next(req);
              }),
              catchError((err) => {
                console.error('Refresh token validation failed:', err);
                return next(req);
              })
            );
          }
          return next(req);
        }
      }),
      catchError((err) => {
        console.error('Token validation failed:', err);
        // If validation fails, proceed without the token
        return next(req);
      })
    );
  }
  return next(req);
}
