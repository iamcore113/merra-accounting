import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../shared/services/auth-service';
import { finalize } from 'rxjs/operators';
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
class VerifyAccountSuccessSnackBar {}

@Component({
  selector: 'app-verify-account',
  imports: [MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './verify-account.html',
  styleUrls: ['./verify-account.scss'],
})
export class VerifyAccount implements OnInit {
  token: string | null = null;
  email: string | null = null;
  temp_token: string | null = null;
  user_id: string | null = null;
  isLoading = true;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private localStorage: LocalStorageService
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      if (token) {
        setTimeout(() => {
          this.token = token;
          this.isLoading = true;
        });
        
        this.authService
          .verifyAccount(token)
          .pipe(
            finalize(() => {
              setTimeout(() => {
                this.isLoading = false;
              });
            })
          )
          .subscribe({
            next: (response: Config) => {
              if (response.result && 'data' in response) {
                const verifiedData = (response as any).data as VerifiedAccountResponse;
                this.email = verifiedData.email;
                this.temp_token = verifiedData.temporaryAccessToken;
                this.user_id = verifiedData.userId;
              }
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
                this.localStorage.setItem('user_email', this.email);
                this.localStorage.setItem('temp_token', this.temp_token);
                this.localStorage.setItem('user_id', this.user_id);
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
