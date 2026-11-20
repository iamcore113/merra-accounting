import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../shared/services/auth-service';
import { combineLatest, timer } from 'rxjs';
import { VerifiedAccountResponse } from '../../shared/models/auth';
import { Config } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import { UserService } from '../../shared/services/user-service';

@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  templateUrl: './verify-account.html',
  styleUrls: ['./verify-account.scss'],
})
export class VerifyAccount implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly userService = inject(UserService, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef);

  token: string | null = null;
  email: string | null = null;
  access_token: string | null = null;
  refresh_token: string | null = null;
  user_id: string | null = null;
  verifiedData: VerifiedAccountResponse | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      const email = params.get('email');
      if (token) {
        this.token = token;
        this.isLoading = true;

        combineLatest([
          this.authService.verifyAccount(token),
          timer(1500),
        ]).subscribe({
          next: ([response]: [Config, number]) => {
            this.isLoading = false;
            if (response.success && 'data' in response) {
              const verifiedData = (response as any).data as VerifiedAccountResponse;
              this.verifiedData = verifiedData;
              this.email = verifiedData.email;
              this.access_token = verifiedData.accessToken;
              this.refresh_token = verifiedData.refreshToken || null;
              this.user_id = verifiedData.userId;
            }
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('Error verifying account', error);
            const errorStatus = error.status;
            const errorDescription = error?.error?.message || error?.message || 'Please check your email for a new PIN code or contact support if the problem persists.';
            this.router.navigate(['/error'], {
              queryParams: {
                code: errorStatus ? errorStatus.toString() : '500',
                message: 'Account Verification Failed',
                description: errorDescription
              },
            });
          },
          complete: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Account verified successfully!',
              life: 5000,
            });
            if (this.access_token) {
              this.localStorage.setItem('access_token', this.access_token);
            }
            if (this.refresh_token) {
              this.localStorage.setItem('refresh_token', this.refresh_token);
            }
            if (this.email) {
              this.localStorage.setItem('user_email', this.email);
            }
            this.localStorage.removeItem('pendingVerificationUserId');
            this.userService?.setAccountUnverified(false);

            const isProfileComplete =
              this.verifiedData?.isProfileComplete ?? this.verifiedData?.profileComplete ?? false;

            if (!isProfileComplete) {
              if (this.email) {
                this.router.navigate(['account/personal-details', this.email]);
              } else {
                this.router.navigate(['account/personal-details']);
              }
              return;
            }

            if (!this.verifiedData?.partOfOrganization) {
              this.router.navigate(
                this.email
                  ? ['/account/organization-choice', this.email]
                  : ['/account/organization-choice']
              );
            } else if (this.verifiedData?.hasActiveWorkspace) {
              this.router.navigate(['/entering-workspace']);
            } else {
              this.router.navigate(['/main/organization']);
            }
          },
        });
      } else if (email) {
        void this.router.navigate(['account/verify-email', email]);
      } else {
        void this.router.navigate(['/account/signup']);
      }
    });
  }
}
