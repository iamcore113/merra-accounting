import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { OrganizationService } from '../services/organization-service';
import { LocalStorageService } from '../services/local-storage-service';
import { UserOrganizationAffiliation } from '../models/organization';

export const organizationMemberGuard: CanActivateFn = () => {
  const organizationService = inject(OrganizationService);
  const localStorage = inject(LocalStorageService);
  const router = inject(Router);

  const token = localStorage.getItem('access_token');
  const email = localStorage.getItem('user_email') || '';

  if (!token) {
    return router.createUrlTree(['/account/signin']);
  }

  const redirectToChoice = () =>
    email
      ? router.createUrlTree(['/account/organization-choice', email])
      : router.createUrlTree(['/account/organization-choice']);

  return organizationService.getUserOrganizationAffiliations().pipe(
    map((res) => {
      if (res.success && 'data' in res && res.data) {
        const affiliation = res.data as UserOrganizationAffiliation;
        const orgs = affiliation.organizations || [];
        if (orgs.length > 0) {
          return true;
        }
      }
      return redirectToChoice();
    }),
    catchError(() => of(redirectToChoice()))
  );
};
