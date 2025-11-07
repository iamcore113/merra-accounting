import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocalStorageService } from '../../services/localStorage/localStorage.service';
import { Observable } from 'rxjs';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const auth = inject(LocalStorageService);
//   const access_token = auth.getItem('access_token');
//   if (access_token) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${access_token}`
//       }
//     });
//   }

//   return next(req);
// };

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const auth = inject(LocalStorageService);
  const access_token = auth.getItem('access_token');
  if (access_token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${access_token}`
      }
    });
  }
  return next(req);
}
