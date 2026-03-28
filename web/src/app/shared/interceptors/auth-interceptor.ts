import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocalStorageService } from '../services/local-storage-service';
import { IS_AUTHENTICATED } from '../context/auth.token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const requiresAuth = req.context.get(IS_AUTHENTICATED);
  console.log('is authenticated: ', requiresAuth);
  const localStorage = inject(LocalStorageService);
  
  const tempToken = localStorage.getItem('temp_token');
  if (tempToken && requiresAuth) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${tempToken}`)
    });
    return next(authReq);
  }

  return next(req);
};
