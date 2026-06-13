import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { BaseService } from '../services/base-service';
import { TokenCheckService } from '../services/token-check-service';
import { LocalStorageService } from '../services/local-storage-service';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export const offlineGuard: CanActivateFn = (route, state) => {
  const baseService = inject(BaseService);
  const tokenService = inject(TokenCheckService);
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  return baseService.getHealth().pipe(
    switchMap(health => {
      if (health?.status === 'UP') {
        const token = localStorageService.getItem('access_token');
        if (token) {
          return tokenService.validateToken(token).pipe(
            map(isValid => isValid ? router.createUrlTree(['/main']) : router.createUrlTree(['/'])),
            catchError(() => of(router.createUrlTree(['/'])))
          );
        }
        return of(router.createUrlTree(['/']));
      }
      return of(true);
    }),
    catchError(() => {
      // Backend request fails (network error, offline) -> server is down -> allow accessing offline page
      return of(true);
    })
  );
};
