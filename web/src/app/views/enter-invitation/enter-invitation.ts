import { Component, OnInit, inject, signal } from '@angular/core';
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
export class EnterInvitation implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly invitationService = inject(InvitationService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly messageService = inject(MessageService);

  invitationForm!: FormGroup;
  emailFromRoute = '';
  isVerifying = signal(false);
  isAccepting = signal(false);
  verificationError = signal<string | null>(null);
  verifiedInvitation = signal<VerifyInvitationResponse | null>(null);

  get isAuthenticated(): boolean {
    return !!this.localStorage.getItem('access_token');
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
        this.invitationForm.patchValue({ token: tokenFromUrl });
        this.verifyToken();
      }
    });
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

    this.isAccepting.set(true);
    this.invitationService
      .acceptInvitation(token)
      .pipe(finalize(() => this.isAccepting.set(false)))
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Invitation Accepted',
            detail: response.data?.message || 'You have joined the organization.',
            life: 5000,
          });
          void this.router.navigate(['/main']);
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

  goToSignin(): void {
    const email = this.verifiedInvitation()?.inviteeEmail || this.emailFromRoute;
    void this.router.navigate(['/account/signin'], {
      queryParams: email ? { email } : undefined,
    });
  }

  goToSignup(): void {
    void this.router.navigate(['/account/signup']);
  }

  goBack(): void {
    if (this.emailFromRoute) {
      void this.router.navigate(['/account/organization-choice', this.emailFromRoute]);
    } else {
      void this.router.navigate(['/account/signin']);
    }
  }
}
