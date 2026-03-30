import { Routes } from '@angular/router';
import { Signup } from './views/signup/signup';
import { Signin } from './views/signin/signin';
import { VerifyEmail } from './views/verify-email/verify-email';
import { AuthLayout } from './shared/components/auth-layout/auth-layout';
import { VerifyAccount } from './views/verify-account/verify-account';
import { PersonalDetails } from './views/personal-details/personal-details';
import { CreateOrganization } from './views/create-organization/create-organization';
import { ErrorPage } from './views/error-page/error-page';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'account',
    component: AuthLayout,
    children: [
      { path: 'signup', component: Signup, title: 'MERRA - Create Account' },
      { path: 'signin', component: Signin, title: 'MERRA - Sign In' },
      { path: 'verify-email/:email', component: VerifyEmail, title: 'MERRA - Verify Email' },
      { path: 'verify', component: VerifyAccount, title: 'MERRA - Verify Account' },
      { path: 'personal-details/:email', component: PersonalDetails, title: 'MERRA - Personal Details' },
    ]
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
