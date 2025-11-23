import { Routes } from '@angular/router';
import { NotFoundComponent } from './features/not-found/not-found.component';
import { provideHttpClient, withInterceptors, withRequestsMadeViaParent } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth/auth-interceptor';
import { OrganizationService } from './core/services/organization/organization.service';
import { AdminMain } from './features/admin-main/admin-main';
import { SignupComponent } from './features/auth/signup/signup.component';
import { LandingComponent } from './features/landing/landing.component';
import { PersonalInfoComponent } from './features/personal-info/personal-info.component';
import { TokenEmailNotificationComponent } from './features/token-email-notification/token-email-notification.component';
import { VerifyTokenComponent } from './features/verify-token/verify-token.component';
import { SigninComponent } from './features/auth/signin/signin.component';
import { CreateOrganization } from './features/create-organization/create-organization';
import { AuthService } from './core/services/auth/auth.service';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
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
    title: 'Create Your Organization - MERRA',
  },
  {
    path: 'admin',
    component: AdminMain,
    title: 'Admin - MERRA',
    providers: [
      provideHttpClient(withInterceptors([authInterceptor]),withRequestsMadeViaParent()),
      OrganizationService
    ],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/main-dashboard/main-dashboard').then(m => m.MainDashboard),
        title: 'Dashboard - MERRA'
      }
    ]
  },
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Page not found'
  }
];
