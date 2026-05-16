import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {LoginRequest, SigninResponse} from '../../shared/models/auth';
import { AuthService } from '../../shared/services/auth-service';
import { Config, ErrorResponse } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';
@Component({
  selector: 'app-signin',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin implements OnInit, OnDestroy {
  signinForm: FormGroup;
  errorMessage: string | null = null;
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const message = params['message'];
      if (message) {
        this.showError(message);
      }
    });
  }

  ngOnDestroy() {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
  }

  private showError(message: string) {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorMessage = message;
    this.errorTimeout = setTimeout(() => this.errorMessage = null, 5000);
  }

  // TODO: Handle accounts that aren't part of organizations
  onSubmit() {
    if (this.signinForm.valid) {
      let verifiedData: SigninResponse;
      const req: LoginRequest = this.signinForm.value;
      this.authService.signin(req).subscribe({
        next: (response: Config) => {
          console.log('Signin response:', response);
          verifiedData = (response as any).data as SigninResponse;
        },
        error: (error) => {
          const errorDict: ErrorResponse = error.error;
          this.snackBar.open(errorDict.message, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
          });
        },
        complete: () => {
          const accessToken = verifiedData.tokens.accessToken;
          const refreshToken = verifiedData.tokens.refreshToken;
          this.localStorage.setItem('access_token', accessToken);
          this.localStorage.setItem('refresh_token', refreshToken);
          this.router.navigate(['/main']);
        }
      });
    }
  }
}
