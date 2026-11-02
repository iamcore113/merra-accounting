import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service';
import { LocalStorageService } from '../services/local-storage-service';
import { Config } from '../models/api_response';
import { EmailVerificationStatusResponse } from '../models/auth';
import { map, catchError, of } from 'rxjs';

export const verifyEmailGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);
  const authService = inject(AuthService);

  // 1. If an access_token already exists, user is already authenticated/activated
  const token = localStorageService.getItem('access_token');
  if (token) {
    return router.createUrlTree(['/']);
  }

  // 2. Validate email parameter from the route
  const email = route.paramMap.get('email');
  if (!email || !email.trim()) {
    return router.createUrlTree(['/']);
  }

  // 3. Query verification status: one-time access strictly for unverified accounts
  return authService.checkVerificationStatus(email.trim()).pipe(
    map((response: Config) => {
      if (response.success && 'data' in response) {
        const status = response.data as EmailVerificationStatusResponse;
        // Allow access ONLY if the account exists, is NOT verified, and is pending verification
        if (status.exists && !status.isVerified && status.isPendingVerification) {
          return true;
        }
      }
      // If already verified, already activated, or not found, redirect to landing page
      return router.createUrlTree(['/']);
    }),
    catchError(() => of(router.createUrlTree(['/'])))
  );
};

