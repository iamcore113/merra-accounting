import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const initInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we are already on the offline page, let the local handler manage the error state.
      if (!router.url.includes('/offline')) {
        // status 0: Server down / network error / CORS failure
        // status 503: Service Unavailable
        // status 504: Gateway Timeout
        if (error.status === 0 || error.status === 503 || error.status === 504) {
          console.warn('Backend server appears to be offline. Redirecting to offline page.');
          router.navigate(['/offline']);
        }
      }
      return throwError(() => error);
    })
  );
};
