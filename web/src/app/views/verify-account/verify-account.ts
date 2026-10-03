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
  private readonly cdr = inject(ChangeDetectorRef);

  token: string | null = null;
  email: string | null = null;
  access_token: string | null = null;
  user_id: string | null = null;
  isLoading = true;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
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
              this.email = verifiedData.email;
              this.access_token = verifiedData.accessToken;
              this.user_id = verifiedData.userId;
            }
            this.cdr.detectChanges();
          },
          error: (error: any) => {
            console.error('Error verifying account', error);
            const errorStatus = error.status;
            const errorDescription = error?.error?.message || error?.message || 'Please check your email for a new verification link or contact support if the problem persists.';
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
            if (this.email) {
              if (this.access_token) {
                this.localStorage.setItem('access_token', this.access_token);
              }
              this.router.navigate(['account/personal-details', this.email]);
            } else {
              this.router.navigate(['account/personal-details']);
            }
          },
        });
      }
    });
  }
}
