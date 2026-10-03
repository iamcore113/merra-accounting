import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { LoginRequest, SigninResponse } from '../../shared/models/auth';
import { AuthService } from '../../shared/services/auth-service';
import { Config, ErrorResponse } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  signinForm: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = signal(false);
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const message = params['message'];
      if (message) {
        this.showError(message);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
  }

  private showError(message: string): void {
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorMessage = message;
    this.errorTimeout = setTimeout(() => this.errorMessage = null, 5000);
  }

  onSubmit(): void {
    if (this.signinForm.valid) {
      this.isSubmitting.set(true);
      let verifiedData: SigninResponse;
      const req: LoginRequest = this.signinForm.value;
      this.authService.signin(req).subscribe({
        next: (response: Config) => {
          console.log('Signin response:', response);
          verifiedData = (response as any).data as SigninResponse;
        },
        error: (error) => {
          this.isSubmitting.set(false);
          const errorDict: ErrorResponse = error.error;
          const msg = errorDict?.message || 'Failed to sign in. Please try again.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: msg,
            life: 5000,
          });
        },
        complete: () => {
          const accessToken = verifiedData.tokens.accessToken;
          const refreshToken = verifiedData.tokens.refreshToken;
          this.localStorage.setItem('access_token', accessToken);
          this.localStorage.setItem('refresh_token', refreshToken);
          this.router.navigate(['/main']);
        },
      });
    }
  }
}
