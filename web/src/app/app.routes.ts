import { Routes } from '@angular/router';
import { Signup } from './views/signup/signup';
import { Signin } from './views/signin/signin';
import { VerifyEmail } from './views/verify-email/verify-email';
import { AuthLayout } from './shared/components/auth-layout/auth-layout';
import { VerifyAccount } from './views/verify-account/verify-account';
import { PersonalDetails } from './views/personal-details/personal-details';
import { CreateOrganization } from './views/create-organization/create-organization';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'account',
    component: AuthLayout,
    children: [
      { path: 'signup', component: Signup, title: 'Create Account' },
      { path: 'signin', component: Signin, title: 'Sign In' },
      { path: 'verify-email/:email', component: VerifyEmail, title: 'Verify Email' },
      { path: 'verify', component: VerifyAccount, title: 'Verify Account' },
      { path: 'personal-details/:email', component: PersonalDetails, title: 'Personal Details' },
    ]
  },
  {
    path: 'create/organization',
    component: CreateOrganization,
    title: 'Create Organization'
  }
];
