import { Component, OnInit, OnDestroy, ElementRef, QueryList, ViewChildren, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../shared/services/auth-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import {
  EmailVerificationStatusResponse,
  ResendEmailVerification,
  VerifiedAccountResponse,
  VerifyPinRequest,
} from '../../shared/models/auth';
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

  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef<HTMLInputElement>>;

  public email: string | null = null;
  public userId: string | null = null;
  public pinDigits = signal<string[]>(['', '', '', '']);
  public pinError = signal<string | null>(null);
  public isVerifying = signal(false);
  public isResending = signal(false);
  public cooldownSeconds = signal(0);

  public isPinComplete = computed(() =>
    this.pinDigits().every((digit) => /^\d$/.test(digit))
  );

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
          const status = res.data as EmailVerificationStatusResponse & {
            verified?: boolean;
            pendingVerification?: boolean;
          };
          const isVerified = status.isVerified ?? status.verified ?? false;
          const isPendingVerification =
            status.isPendingVerification ?? status.pendingVerification ?? false;
          if (!status.exists || isVerified || !isPendingVerification) {
            void this.router.navigate(['/']);
          }
        }
      },
      error: () => {
        void this.router.navigate(['/']);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.replace(/\D/g, '');
    this.pinError.set(null);

    if (!rawValue) {
      this.updateDigit(index, '');
      input.value = '';
      return;
    }

    const digit = rawValue.slice(-1);
    this.updateDigit(index, digit);
    input.value = digit;

    if (index < 3) {
      this.focusInput(index + 1);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      this.pinError.set(null);
      const currentDigits = this.pinDigits();
      if (currentDigits[index]) {
        this.updateDigit(index, '');
      } else if (index > 0) {
        this.updateDigit(index - 1, '');
        this.focusInput(index - 1);
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < 3) {
      this.focusInput(index + 1);
      event.preventDefault();
    } else if (event.key === 'Enter' && this.isPinComplete()) {
      this.onSubmitPin();
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedText.replace(/\D/g, '').slice(0, 4);
    if (!digitsOnly) {
      return;
    }

    this.pinError.set(null);
    const updated = [...this.pinDigits()];
    for (let i = 0; i < 4; i++) {
      updated[i] = digitsOnly[i] || '';
    }
    this.pinDigits.set(updated);

    const inputs = this.pinInputs?.toArray() || [];
    inputs.forEach((el, idx) => {
      el.nativeElement.value = updated[idx];
    });

    const focusIdx = Math.min(digitsOnly.length, 3);
    this.focusInput(focusIdx);
  }

  onSubmitPin(): void {
    if (!this.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Email',
        detail: 'No email address found for account activation.',
        life: 5000,
      });
      return;
    }

    const pin = this.pinDigits().join('');
    if (!/^\d{4}$/.test(pin)) {
      this.pinError.set('Please enter the 4-digit PIN code sent to your email.');
      return;
    }

    if (this.isVerifying()) {
      return;
    }

    this.isVerifying.set(true);
    this.pinError.set(null);

    const request: VerifyPinRequest = {
      email: this.email,
      pin,
    };

    this.authService
      .verifyPin(request)
      .pipe(
        finalize(() => {
          this.isVerifying.set(false);
        })
      )
      .subscribe({
        next: (response: Config) => {
          let verifiedEmail = this.email;
          if (response.success && 'data' in response) {
            const verifiedData = (response as any).data as VerifiedAccountResponse;
            if (verifiedData.accessToken) {
              this.localStorage.setItem('access_token', verifiedData.accessToken);
            }
            if (verifiedData.email) {
              verifiedEmail = verifiedData.email;
            }
          }

          this.localStorage.removeItem('pendingVerificationUserId');
          this.messageService.add({
            severity: 'success',
            summary: 'Account Activated',
            detail: 'Your account has been activated successfully!',
            life: 5000,
          });

          if (verifiedEmail) {
            this.localStorage.setItem('user_email', verifiedEmail);
            void this.router.navigate(['account/personal-details', verifiedEmail]);
          } else {
            void this.router.navigate(['account/personal-details']);
          }
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Invalid or expired PIN code. Please try again.';

          this.pinError.set(errorMessage);
          this.messageService.add({
            severity: 'error',
            summary: 'Activation Failed',
            detail: errorMessage,
            life: 5000,
          });
        },
      });
  }

  onResend(): void {
    if (!this.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Missing Email',
        detail: 'No email address found to resend the PIN code.',
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
        next: () => {
          this.clearPinInputs();
          this.messageService.add({
            severity: 'success',
            summary: 'PIN Code Sent',
            detail: 'A new 4-digit PIN code has been sent to your email.',
            life: 5000,
          });
          this.startCooldown(60);
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Failed to resend PIN code. Please try again.';

          if (
            errorMessage.toLowerCase().includes('already verified') ||
            errorMessage.toLowerCase().includes('already enabled')
          ) {
            this.messageService.add({
              severity: 'info',
              summary: 'Account Already Active',
              detail: 'Your account is already activated. Redirecting...',
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

  private updateDigit(index: number, value: string): void {
    const updated = [...this.pinDigits()];
    updated[index] = value;
    this.pinDigits.set(updated);
  }

  private clearPinInputs(): void {
    this.pinDigits.set(['', '', '', '']);
    this.pinError.set(null);
    const inputs = this.pinInputs?.toArray() || [];
    inputs.forEach((el) => {
      el.nativeElement.value = '';
    });
    this.focusInput(0);
  }

  private focusInput(index: number): void {
    const inputs = this.pinInputs?.toArray() || [];
    const target = inputs[index]?.nativeElement;
    if (target) {
      target.focus();
      target.select();
    }
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
