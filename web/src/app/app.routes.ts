import { Routes } from '@angular/router';
import { Signup } from './views/signup/signup';
import { Signin } from './views/signin/signin';
import { VerifyEmail } from './views/verify-email/verify-email';
import { VerifyAccount } from './views/verify-account/verify-account';
import { PersonalDetails } from './views/personal-details/personal-details';
import { CreateOrganization } from './views/create-organization/create-organization';
import { ErrorPage } from './views/error-page/error-page';
import { MainLayout } from './shared/components/main-layout/main-layout';
import { MainHome } from './views/main/main-home/main-home';
import { CompleteOrganizationDetailsForm } from './views/complete-organization-details-form/complete-organization-details-form';
import { NoOrganizationPage } from './views/no-organization-page/no-organization-page';
import { LandingPage } from './views/landing-page/landing-page';
import { aUTHGUARDGuard } from './shared/guards/auth-guard-guard';
import { MainContact } from './views/main/main-contact/main-contact';
import { OfflinePage } from './views/offline-page/offline-page';
import { offlineGuard } from './shared/guards/offline-guard';

export const routes: Routes = [
  { path: '', component: LandingPage, title: 'MERRA - Landing Page' },
  { path: 'offline', component: OfflinePage, canActivate: [offlineGuard], title: 'MERRA - Offline' },
  { path: 'account/signup', component: Signup, title: 'MERRA - Create Account' },
  { path: 'account/signin', component: Signin, title: 'MERRA - Sign In' },
  { path: 'account/verify-email/:email', component: VerifyEmail, title: 'MERRA - Verify Email' },
  { path: 'account/verify', component: VerifyAccount, title: 'MERRA - Verify Account' },
  { path: 'account/personal-details/:email', component: PersonalDetails, title: 'MERRA - Personal Details' },
  {
    path: 'main',
    component: MainLayout,
    canActivate: [aUTHGUARDGuard],
    children: [
      {
        path: '',
        loadComponent: () => MainHome,
        title: 'MERRA - Dashboard'
      },
      {
        path: 'profile',
        loadComponent: () => import('./views/main/main-profile/main-profile').then(m => m.MainProfile),
        title: 'MERRA - Profile'
      },
      {
        path: 'organization',
        loadComponent: () => import('./views/main/main-organization/main-organization').then(m => m.MainOrganization),
        title: 'MERRA - Organization'
      },
      {
        path: 'invoice',
        loadComponent: () => import('./views/main/main-invoice/list-invoice/list-invoice').then(m => m.ListInvoice),
        title: 'MERRA - Invoices'
      },
      {
        path: 'invoice/new',
        loadComponent: () => import('./views/main/main-invoice/new-invoice/new-invoice').then(m => m.NewInvoice),
        title: 'MERRA - New Invoice'
      },
      {
        path: 'contacts',
        loadComponent: () => import('./views/main/main-contact/main-contact').then(m => m.MainContact),
        title: 'MERRA - Contacts'
      }
    ]
  },
  {
    path: 'no-organization',
    component: NoOrganizationPage,
    title: 'MERRA - No Organization'
  },
  {
    path: 'complete-organization-details/:email',
    component: CompleteOrganizationDetailsForm,
    title: 'MERRA - Complete Organization Details'
  },
  {
    path: 'create/organization/:email',
    component: CreateOrganization,
    title: 'MERRA - Create Organization'
  },
  {
    path: 'error',
    component: ErrorPage,
    title: 'MERRA - Error Page'
  }
];
