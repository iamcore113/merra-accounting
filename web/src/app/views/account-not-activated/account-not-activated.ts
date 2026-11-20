import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AuthService } from '../../shared/services/auth-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';

@Component({
  selector: 'app-account-not-activated',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './account-not-activated.html',
  styleUrl: './account-not-activated.scss',
})
export class AccountNotActivated implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly localStorage = inject(LocalStorageService);

  email: string | null = null;
  isSendingPin = signal(false);

  ngOnInit(): void {
    const paramEmail = this.route.snapshot.paramMap.get('email');
    const queryEmail = this.route.snapshot.queryParamMap.get('email');
    const stateEmail = history.state?.email;

    this.email = (paramEmail || queryEmail || stateEmail || '').trim() || null;

    if (!this.email) {
      void this.router.navigate(['/account/signin']);
    }
  }

  proceedToPinActivation(): void {
    if (!this.email) {
      void this.router.navigate(['/account/signin']);
      return;
    }

    if (this.isSendingPin()) {
      return;
    }

    const targetEmail = this.email;
    this.isSendingPin.set(true);

    this.authService
      .resendVerificationEmail({ email: targetEmail })
      .pipe(
        finalize(() => {
          this.isSendingPin.set(false);
        })
      )
      .subscribe({
        next: (response: any) => {
          const userId = response?.data?.userDetail?.userId;
          if (userId) {
            this.localStorage.setItem('pendingVerificationUserId', userId);
          }

          this.messageService.add({
            severity: 'success',
            summary: 'PIN Code Sent',
            detail: 'A 4-digit activation PIN code has been sent to your email.',
            life: 5000,
          });

          void this.router.navigate(['/account/verify-email', targetEmail], {
            queryParams: userId ? { uid: userId } : {},
          });
        },
        error: (error) => {
          const errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            '';

          if (
            errorMessage.toLowerCase().includes('already verified') ||
            errorMessage.toLowerCase().includes('already enabled')
          ) {
            this.messageService.add({
              severity: 'info',
              summary: 'Account Already Active',
              detail: 'Your account is already activated. You can now sign in.',
              life: 4000,
            });
            void this.router.navigate(['/account/signin'], {
              queryParams: { email: targetEmail },
              state: { email: targetEmail },
            });
            return;
          }

          // Still navigate to the PIN entry page so the user can enter an existing PIN or try resending there
          void this.router.navigate(['/account/verify-email', targetEmail]);
        },
      });
  }

  backToSignin(): void {
    if (this.email) {
      void this.router.navigate(['/account/signin'], {
        queryParams: { email: this.email },
        state: { email: this.email },
      });
    } else {
      void this.router.navigate(['/account/signin']);
    }
  }
}
