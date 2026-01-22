import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocalStorageService } from '../../services/localStorage/localStorage.service';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const ls = inject(LocalStorageService);
  const auth = inject(AuthService);
  const access_token = ls.getItem('access_token');

  if (access_token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${access_token}`
      }
    });
  }
  return next(req);
}
