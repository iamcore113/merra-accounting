import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TokenCheckService } from '../services/token-check-service';
import { LocalStorageService } from '../services/local-storage-service';
import { map } from 'rxjs/operators';

export const aUTHGUARDGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenCheckService);
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  const token = localStorageService.getItem('access_token');
  if (!token) {
    return router.createUrlTree(['/']);
  }
  return tokenService.validateToken(token).pipe(
    map(isValid => isValid ? true : router.createUrlTree(['/']))
  );
};
