import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { InvitationService } from '../../shared/services/invitation-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import { VerifyInvitationResponse } from '../../shared/models/invitation';

@Component({
  selector: 'app-enter-invitation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TextareaModule,
    TagModule,
    DatePipe,
  ],
  templateUrl: './enter-invitation.html',
  styleUrl: './enter-invitation.scss',
})
export class EnterInvitation implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invitationService = inject(InvitationService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly messageService = inject(MessageService);

  private static readonly TRANSITION_DISPLAY_MS = 1600;
  private static readonly EXIT_ANIMATION_MS = 350;

  invitationForm!: FormGroup;
  emailFromRoute = '';
  private cameFromInvitationLink = false;
  private transitionTimeout?: ReturnType<typeof setTimeout>;
  private exitTimeout?: ReturnType<typeof setTimeout>;
  isVerifying = signal(false);
  isAccepting = signal(false);
  isTransitioning = signal(false);
  isLeaving = signal(false);
  verificationError = signal<string | null>(null);
  verifiedInvitation = signal<VerifyInvitationResponse | null>(null);

  get isAuthenticated(): boolean {
    return !!this.localStorage.getItem('access_token');
  }

  get isAuthenticatedAsInvitee(): boolean {
    if (!this.isAuthenticated) {
      return false;
    }
    const inviteeEmail = this.verifiedInvitation()?.inviteeEmail?.trim().toLowerCase();
    const currentEmail = (this.localStorage.getItem('user_email') || this.emailFromRoute || '').trim().toLowerCase();
    if (!inviteeEmail || !currentEmail) {
      return this.verifiedInvitation()?.accountExists !== false;
    }
    return inviteeEmail === currentEmail;
  }

  ngOnInit(): void {
    this.invitationForm = this.fb.group({
      token: ['', [Validators.required]],
    });

    this.route.paramMap.subscribe(params => {
      this.emailFromRoute = params.get('email') || this.localStorage.getItem('user_email') || '';
    });

    this.route.queryParamMap.subscribe(queryParams => {
      const tokenFromUrl = queryParams.get('token');
      if (tokenFromUrl) {
        this.cameFromInvitationLink = true;
        this.invitationForm.patchValue({ token: tokenFromUrl });
        this.verifyToken();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
    }
    if (this.exitTimeout) {
      clearTimeout(this.exitTimeout);
    }
  }

  verifyToken(): void {
    this.invitationForm.markAllAsTouched();
    if (this.invitationForm.invalid) {
      return;
    }

    const token = (this.invitationForm.value.token as string).trim();
    this.isVerifying.set(true);
    this.verificationError.set(null);
    this.verifiedInvitation.set(null);

    this.invitationService
      .verifyInvitation(token)
      .pipe(finalize(() => this.isVerifying.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success && response.data?.valid) {
            this.verifiedInvitation.set(response.data);
            this.savePendingInvitation(token, response.data);
          } else {
            this.verificationError.set(response.data?.message || response.message || 'Invalid invitation token.');
          }
        },
        error: (err) => {
          const msg =
            err?.error?.data?.message ||
            err?.error?.message ||
            'Unable to verify invitation token. It may be invalid or expired.';
          this.verificationError.set(msg);
        },
      });
  }

  acceptInvitation(): void {
    const token = (this.invitationForm.value.token as string)?.trim();
    if (!token || this.isAccepting()) {
      return;
    }

    const info = this.verifiedInvitation();
    if (info?.accountExists === false) {
      this.savePendingInvitation(token, info);
      this.localStorage.removeItem('access_token');
      this.localStorage.removeItem('refresh_token');
      this.localStorage.removeItem('user_email');
      this.startSmoothRedirect('/main/organization');
      return;
    }

    if (!this.isAuthenticated || !this.isAuthenticatedAsInvitee) {
      this.savePendingInvitation(token, info ?? undefined);
      this.goToSignin();
      return;
    }

    this.isAccepting.set(true);
    this.invitationService
      .acceptInvitation(token)
      .pipe(finalize(() => this.isAccepting.set(false)))
      .subscribe({
        next: () => {
          this.clearPendingInvitation();
          this.startSmoothRedirect('/main/organization');
        },
        error: (err) => {
          const msg = err?.error?.message || 'Failed to accept invitation. Please check your account email.';
          this.verificationError.set(msg);
          this.messageService.add({
            severity: 'error',
            summary: 'Cannot Join Organization',
            detail: msg,
            life: 5000,
          });
        },
      });
  }

  private startSmoothRedirect(targetRoute: string): void {
    this.isTransitioning.set(true);
    this.transitionTimeout = setTimeout(() => {
      this.isLeaving.set(true);
      this.exitTimeout = setTimeout(() => {
        void this.router.navigate([targetRoute]);
      }, EnterInvitation.EXIT_ANIMATION_MS);
    }, EnterInvitation.TRANSITION_DISPLAY_MS);
  }

  goToSignin(): void {
    const token = (this.invitationForm.value.token as string)?.trim();
    const info = this.verifiedInvitation();
    const email = info?.inviteeEmail || this.emailFromRoute;
    this.savePendingInvitation(token, info ?? undefined, email);
    void this.router.navigate(['/account/signin'], {
      queryParams: email ? { email } : undefined,
    });
  }

  goToSignup(): void {
    const token = (this.invitationForm.value.token as string)?.trim();
    const info = this.verifiedInvitation();
    this.savePendingInvitation(token, info ?? undefined);
    this.localStorage.removeItem('access_token');
    this.localStorage.removeItem('refresh_token');
    this.localStorage.removeItem('user_email');
    void this.router.navigate(['/main/organization']);
  }

  private savePendingInvitation(
    token?: string,
    info?: VerifyInvitationResponse,
    fallbackEmail?: string
  ): void {
    if (token) {
      this.localStorage.setItem('pending_invitation_token', token);
    }
    const email = info?.inviteeEmail || fallbackEmail;
    if (email) {
      this.localStorage.setItem('pending_invitation_email', email);
    }
    if (info?.organizationId) {
      this.localStorage.setItem('pending_invitation_org_id', info.organizationId);
    }
    if (info?.organizationDisplayName) {
      this.localStorage.setItem('pending_invitation_org_name', info.organizationDisplayName);
    }
    if (info?.organizationLegalName) {
      this.localStorage.setItem('pending_invitation_legal_name', info.organizationLegalName);
    }
    if (info?.role) {
      this.localStorage.setItem('pending_invitation_role', info.role);
    }
  }

  private clearPendingInvitation(): void {
    this.localStorage.removeItem('pending_invitation_token');
    this.localStorage.removeItem('pending_invitation_email');
    this.localStorage.removeItem('pending_invitation_org_id');
    this.localStorage.removeItem('pending_invitation_org_name');
    this.localStorage.removeItem('pending_invitation_legal_name');
    this.localStorage.removeItem('pending_invitation_role');
  }

  goBack(): void {
    if (this.emailFromRoute) {
      void this.router.navigate(['/account/organization-choice', this.emailFromRoute]);
    } else {
      void this.router.navigate(['/account/signin']);
    }
  }
}
