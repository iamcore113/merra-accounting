import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../shared/services/auth-service';
import { combineLatest, timer } from 'rxjs';
import { VerifiedAccountResponse } from '../../shared/models/auth';
import { Config } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';

@Component({
  selector: 'app-verify-account-success-snackbar',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <span style="display: inline-flex; align-items: center; gap: 8px;">
      <mat-icon style="color: #2e7d32;">check_circle</mat-icon>
      <span>Account verified successfully!</span>
    </span>
  `,
})
class VerifyAccountSuccessSnackBar { }

@Component({
  selector: 'app-verify-account',
  imports: [MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './verify-account.html',
  styleUrls: ['./verify-account.scss'],
})
export class VerifyAccount implements OnInit {
  token: string | null = null;
  email: string | null = null;
  access_token: string | null = null;
  user_id: string | null = null;
  isLoading = true;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private localStorage: LocalStorageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      if (token) {
        this.token = token;
        this.isLoading = true;

        combineLatest([
          this.authService.verifyAccount(token),
          timer(1500)
        ]).subscribe({
          next: ([response]: [Config, number]) => {
            this.isLoading = false;
            if (response.success && 'data' in response) {
              const verifiedData = (response as any).data as VerifiedAccountResponse;
              this.email = verifiedData.email;
              this.access_token = verifiedData.accessToken;
              this.user_id = verifiedData.userId;
            }
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('Error verifying account', error);
            const errorStatus = error.status;
            const errorMessage = error?.message || 'Failed to verify account. The verification link may be invalid or expired.';
            const errorDescription = error?.error?.message || 'Please check your email for a new verification link or contact support if the problem persists.';
            this.router.navigate(['/error'], {
              queryParams: {
                code: errorStatus.toString(),
                message: 'Account Verification Failed',
                description: errorDescription
              }
            });
          },
          complete: () => {
            this.snackBar.openFromComponent(VerifyAccountSuccessSnackBar, {
              duration: 5000,
            });
            if (this.email) {
              this.localStorage.setItem('access_token', this.access_token);
              this.router.navigate(['account/personal-details', this.email]);
            } else {
              this.router.navigate(['account/personal-details']);
            }
          }
        });
      }
    });
  }

}
