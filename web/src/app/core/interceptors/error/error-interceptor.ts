import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent, HttpEventType } from '@angular/common/http';
import { catchError, Observable, retry, tap, throwError } from 'rxjs';
import { VERIFY_EMAIL_V1 } from '../../utils/api';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    // retry({ count: 3, delay: 1000 }),
    catchError((error: HttpErrorResponse) => {
      const url = new URL(error.url || '').pathname.slice(1);
      if (url === VERIFY_EMAIL_V1) {
        // redirect to homepage
        router.navigate(['/']);
      }
      return throwError(() => error);
    })
  );
};
