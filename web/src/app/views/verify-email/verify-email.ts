import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../shared/services/auth-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import { EmailVerificationStatusResponse, ResendEmailVerification } from '../../shared/models/auth';
import { Config } from '../../shared/models/api_response';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly localStorage = inject(LocalStorageService);

  public email: string | null = null;
  public userId: string | null = null;
  public isResending = signal(false);
  public cooldownSeconds = signal(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    // 1. One-time access check: If user already has an active access token, redirect to landing
    if (this.localStorage.getItem('access_token')) {
      void this.router.navigate(['/']);
      return;
    }

    this.email = this.route.snapshot.paramMap.get('email');
    if (!this.email) {
      void this.router.navigate(['/']);
      return;
    }

    this.userId =
      this.route.snapshot.queryParamMap.get('uid') ||
      this.localStorage.getItem('pendingVerificationUserId');

    // 2. Query backend to verify this account is genuinely pending verification and not already activated
    this.authService.checkVerificationStatus(this.email).subscribe({
      next: (res: Config) => {
        if (res.success && 'data' in res) {
          const status = res.data as EmailVerificationStatusResponse;
          if (!status.exists || status.isVerified || !status.isPendingVerification) {
            void this.router.navigate(['/']);
          }
        }
      },
      error: () => {
        void this.router.navigate(['/']);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  onResend(): void {
    if (!this.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Email',
        detail: 'No email address found to resend verification.',
        life: 5000,
      });
      return;
    }

    if (this.isResending() || this.cooldownSeconds() > 0) {
      return;
    }

    this.isResending.set(true);

    const payload: ResendEmailVerification = {
      email: this.email,
      ...(this.userId ? { userId: this.userId } : {}),
    };

    this.authService
      .resendVerificationEmail(payload)
      .pipe(
        finalize(() => {
          this.isResending.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Email Sent',
            detail: 'A new verification email has been sent. Please check your inbox.',
            life: 5000,
          });
          this.startCooldown(60);
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Failed to resend verification email. Please try again.';

          if (
            errorMessage.toLowerCase().includes('already verified') ||
            errorMessage.toLowerCase().includes('already enabled')
          ) {
            this.messageService.add({
              severity: 'info',
              summary: 'Account Already Active',
              detail: 'Your email is already verified. Redirecting...',
              life: 3000,
            });
            setTimeout(() => {
              void this.router.navigate(['/']);
            }, 1000);
            return;
          }

          this.messageService.add({
            severity: 'error',
            summary: 'Resend Failed',
            detail: errorMessage,
            life: 5000,
          });
        },
      });
  }

  private startCooldown(seconds: number): void {
    this.cooldownSeconds.set(seconds);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      this.cooldownSeconds.update((s) => {
        if (s <= 1) {
          if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }
}
