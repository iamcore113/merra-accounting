import { Routes } from '@angular/router';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { LandingComponent } from './features/landing/landing.component';
import { PersonalInfoComponent } from './features/personal-info/personal-info.component';
import { TokenEmailNotificationComponent } from './features/token-email-notification/token-email-notification.component';
import { VerifyTokenComponent } from './features/verify-token/verify-token.component';
import { SigninComponent } from './features/auth/signin/signin.component';
import { CreateOrganization } from './features/create-organization/create-organization';
import { authGuard } from './core/guards/auth/auth-guard';
import { Main } from './features/main/main';
import { OrphanAccount } from './features/orphan-account/orphan-account';
import { CreateInvoice } from './features/create-invoice/create-invoice';

export const routes: Routes = [
  {
    path: 'home',
    component: LandingComponent,
    title: 'MERRA - Manage. Report. Repeat.'
  },
  {
    path: '',
    component: Main,
    //canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/main-dashboard/main-dashboard').then(m => m.MainDashboard),
        title: 'Dashboard - MERRA'
      },
      {
        path: 'invoice/create',
        loadComponent: () => import('./features/create-invoice/create-invoice').then(m => m.CreateInvoice),
        title: 'Create Invoice'
      }
    ]
  },
  {
    path: 'account/orphan/:email',
    component: OrphanAccount,
    title: 'Orphan Account'
  },
  {
    path: 'account/signin',
    component: SigninComponent
  },
  {
    path: 'account/signup',
    component: SignupComponent,
    title: 'Create Your Account - MERRA'
  },
  {
    path: 'email/verification/:email',
    component: TokenEmailNotificationComponent,
    title: 'Verify Email'
  },
  {
    path: 'auth/signup/req/verify',
    component: VerifyTokenComponent,
    title: 'Verifying Token...'
  },
  {
    path: 'account/personal/info/:email',
    component: PersonalInfoComponent,
    title: 'Fill Personal Information'
  },
  {
    path:'account/organization/create/:email',
    component: CreateOrganization,
    title: 'Create Your Organization - MERRA'
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page not found'
  }
];
