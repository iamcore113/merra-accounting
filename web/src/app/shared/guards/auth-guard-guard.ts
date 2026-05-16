import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { TokenCheckService } from '../services/token-check-service';
import { LocalStorageService } from '../services/local-storage-service';

export const aUTHGUARDGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenCheckService);
  const localStorageService = inject(LocalStorageService);
  console.log("HAHAHAHAHAHAHAH")
  const token = localStorageService.getItem('access_token');
  console.log(token);
  if (!token) {
    return false;
  }

  return tokenService.validateToken(token);
};
