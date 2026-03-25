import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../shared/services/auth-service';

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
  isLoading = true;
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');
      if (this.token) {
        this.authService.verifyAccount(this.token).subscribe({
          next: () => {
            this.snackBar.openFromComponent(VerifyAccountSuccessSnackBar, {
              duration: 5000,
            });
          },
          error: (error: any) => {
            console.error('Error verifying account', error);
            this.snackBar.open('Error verifying account. Please try again.', 'Dismiss', {
              duration: 5000,
            });
          },
          complete: () => {
            console.log('Verification complete');
            this.isLoading = false;
          }
        });
      }
    });
  }

}
