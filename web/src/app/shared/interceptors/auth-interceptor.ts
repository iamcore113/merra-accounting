import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { LocalStorageService } from '../services/local-storage-service';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { TokenCheckService } from '../services/token-check-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const requiresAuth = req.context.get(IS_AUTHENTICATED);
  const localStorage = inject(LocalStorageService);
  const tokenCheckService = inject(TokenCheckService);
  const router = inject(Router);
  
  const tempToken = localStorage.getItem('temp_token');
  console.log(`requiresAuth: ${requiresAuth}`);
  if (!tempToken && requiresAuth) {
    // No token and auth required - redirect to signin with message
    router.navigate(['/account/signin'], { 
      queryParams: { message: 'Invalid token. Please login again.' }
    });
    return throwError(() => new Error('No authentication token found'));
  }
  
  if (tempToken && requiresAuth) {
    // Add token to Authorization header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${tempToken}`)
    });
    return next(authReq);
  }

  return next(req);
};
