import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    const urlTree = router.parseUrl('/home');
    return new RedirectCommand(urlTree);
  }
  return true;
};
