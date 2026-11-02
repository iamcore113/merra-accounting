import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../shared/services/auth-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import { ResendEmailVerification } from '../../shared/models/auth';
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
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly localStorage = inject(LocalStorageService);

  public email: string | null = null;
  public userId: string | null = null;
  public isResending = signal(false);
  public cooldownSeconds = signal(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.email = this.route.snapshot.paramMap.get('email');
    this.userId =
      this.route.snapshot.queryParamMap.get('uid') ||
      this.localStorage.getItem('pendingVerificationUserId');
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
