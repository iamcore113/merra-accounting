import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocalStorageService } from '../../services/localStorage/localStorage.service';
import { Observable } from 'rxjs';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const auth = inject(LocalStorageService);
  const access_token = auth.getItem('access_token');
  console.log('Auth Interceptor Invoked. Access Token:', access_token);
  if (access_token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${access_token}`
      }
    });
  }
  return next(req);
}
