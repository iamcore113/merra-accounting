import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { LoginRequest, SigninResponse } from '../../shared/models/auth';
import { AuthService } from '../../shared/services/auth-service';
import { InvitationService } from '../../shared/services/invitation-service';
import { Config, ErrorResponse } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly invitationService = inject(InvitationService, { optional: true });
  private readonly localStorage = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  signinForm: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = signal(false);
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const message = params['message'];
      if (message) {
        this.showError(message);
      }
      const email = params['email'] || history.state?.email;
      if (email) {
        this.signinForm.patchValue({ email });
        this.signinForm.get('email')?.markAsTouched();
        this.focusPassword();
      }
    });

    const stateEmail = history.state?.email;
    if (stateEmail && !this.signinForm.get('email')?.value) {
      this.signinForm.patchValue({ email: stateEmail });
      this.signinForm.get('email')?.markAsTouched();
      this.focusPassword();
    }
  }

  private focusPassword(): void {
    setTimeout(() => {
      const pwdInput = (document.querySelector('#password input') ||
        document.querySelector('input[type="password"]')) as HTMLElement | null;
      pwdInput?.focus();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
  }

  private showError(message: string): void {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorMessage = message;
    this.errorTimeout = setTimeout(() => this.errorMessage = null, 5000);
  }

  goToForgotPassword(): void {
    const email = this.signinForm.get('email')?.value;
    void this.router.navigate(['/account/forgot-password'], { state: { email: email || '' } });
  }

  onSubmit(): void {
    if (this.signinForm.valid) {
      this.isSubmitting.set(true);
      let verifiedData: SigninResponse;
      const req: LoginRequest = this.signinForm.value;
      this.authService.signin(req).subscribe({
        next: (response: Config) => {
          console.log('Signin response:', response);
          verifiedData = (response as any).data as SigninResponse;
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const errorDict: ErrorResponse = error.error;
          const msg = errorDict?.message || 'Failed to sign in. Please try again.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
            life: 5000,
          });
        },
        complete: () => {
          const accessToken = verifiedData.tokens.accessToken;
          const refreshToken = verifiedData.tokens.refreshToken;
          this.localStorage.setItem('access_token', accessToken);
          this.localStorage.setItem('refresh_token', refreshToken);
          const userEmail = verifiedData.userdetails?.email || req.email || '';
          if (userEmail) {
            this.localStorage.setItem('user_email', userEmail);
          }

          const status = verifiedData.accountStatus;
          const isProfileComplete = status?.complete ?? status?.isComplete ?? true;

          if (!isProfileComplete) {
            this.router.navigate(userEmail ? ['/account/personal-details', userEmail] : ['/account/personal-details']);
            return;
          }

          const pendingToken = this.localStorage.getItem('pending_invitation_token');
          const pendingEmail = this.localStorage.getItem('pending_invitation_email');
          const matchesPendingEmail =
            !pendingEmail || pendingEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

          if (pendingToken && matchesPendingEmail && this.invitationService) {
            this.invitationService.acceptInvitation(pendingToken).subscribe({
              next: (invRes) => {
                this.localStorage.removeItem('pending_invitation_token');
                this.localStorage.removeItem('pending_invitation_email');
                this.messageService.add({
                  severity: 'success',
                  summary: 'Invitation Accepted',
                  detail: invRes.data?.message || 'You have joined the organization.',
                  life: 5000,
                });
                void this.router.navigate(['/main/organization']);
              },
              error: (err) => {
                this.localStorage.removeItem('pending_invitation_token');
                this.localStorage.removeItem('pending_invitation_email');
                this.messageService.add({
                  severity: 'error',
                  summary: 'Cannot Join Organization',
                  detail: err?.error?.message || 'Failed to accept organization invitation.',
                  life: 5000,
                });
                this.navigatePostSignin(status, userEmail);
              },
            });
            return;
          }

          this.navigatePostSignin(status, userEmail);
        },
      });
    }
  }

  private navigatePostSignin(status: SigninResponse['accountStatus'], userEmail: string): void {
    if (!status?.partOfOrganization) {
      this.router.navigate(
        userEmail ? ['/account/organization-choice', userEmail] : ['/account/organization-choice']
      );
    } else if (status?.hasActiveWorkspace) {
      this.router.navigate(['/entering-workspace']);
    } else {
      this.router.navigate(['/select-organization']);
    }
  }
}
