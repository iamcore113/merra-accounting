import { Routes } from '@angular/router';
import { Signup } from './views/signup/signup';
import { Signin } from './views/signin/signin';
import { VerifyEmail } from './views/verify-email/verify-email';
import { AuthLayout } from './shared/components/auth-layout/auth-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'account',
    component: AuthLayout,
    children: [
      { path: 'signup', component: Signup },
      { path: 'signin', component: Signin },
      { path: 'verify-email', component: VerifyEmail },
    ]
  },
];
