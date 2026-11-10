import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../shared/services/auth-service';
import { CreateAccountRequest } from '../../shared/models/auth';
import { LocalStorageService } from '../../shared/services/local-storage-service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    RadioButtonModule,
    CheckboxModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  private readonly auth_service = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly localStorage = inject(LocalStorageService);

  signupForm: FormGroup;
  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]],
    });

    const passwordCtrl = this.signupForm.get('password')!;
    const confirmCtrl = this.signupForm.get('confirmPassword')!;

    confirmCtrl.addValidators(this.confirmMatchValidator(passwordCtrl));

    passwordCtrl.valueChanges.subscribe(() => {
      confirmCtrl.updateValueAndValidity({ emitEvent: false });
    });
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  get passwordValue(): string {
    return this.signupForm?.get('password')?.value || '';
  }

  get passwordTouched(): boolean {
    const ctrl = this.signupForm?.get('password');
    return !!(ctrl?.dirty || ctrl?.touched);
  }

  get hasMinLength(): boolean {
    return this.passwordValue.length >= 8;
  }

  get hasUpperAndLower(): boolean {
    return /[a-z]/.test(this.passwordValue) && /[A-Z]/.test(this.passwordValue);
  }

  get hasNumber(): boolean {
    return /\d/.test(this.passwordValue);
  }

  get hasSymbol(): boolean {
    return /[^A-Za-z0-9]/.test(this.passwordValue);
  }

  get isPasswordAllValid(): boolean {
    return this.hasMinLength && this.hasUpperAndLower && this.hasNumber && this.hasSymbol;
  }

  get confirmPasswordValue(): string {
    return this.signupForm?.get('confirmPassword')?.value || '';
  }

  get confirmPasswordTouched(): boolean {
    const ctrl = this.signupForm?.get('confirmPassword');
    return !!(ctrl?.dirty || ctrl?.touched);
  }

  get isConfirmPasswordValid(): boolean {
    return (
      this.confirmPasswordValue.length > 0 &&
      this.confirmPasswordValue === this.passwordValue &&
      this.isPasswordAllValid
    );
  }

  passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value || '';
      if (!value) return null;

      const hasMinLength = value.length >= 8;
      const hasUpperAndLower = /[a-z]/.test(value) && /[A-Z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSymbol = /[^A-Za-z0-9]/.test(value);

      if (hasMinLength && hasUpperAndLower && hasNumber && hasSymbol) {
        return null;
      }

      return {
        passwordRequirements: {
          hasMinLength,
          hasUpperAndLower,
          hasNumber,
          hasSymbol,
        },
      };
    };
  }

  confirmMatchValidator(passwordCtrl: AbstractControl): ValidatorFn {
    return (confirmCtrl: AbstractControl): ValidationErrors | null => {
      const password: string = passwordCtrl.value ?? '';
      const confirm: string = confirmCtrl.value ?? '';
      if (!confirm) return null;
      if (confirm !== password) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  onSubmit(): void {
    if (this.signupForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      let pendingErrorMessage: string | null = null;

      const req: CreateAccountRequest = {
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
        gender: this.signupForm.value.gender,
      };
      this.auth_service.signup(req).pipe(
        finalize(() => {
          this.isSubmitting.set(false);

          if (pendingErrorMessage) {
            this.messageService.add({
              severity: 'error',
              summary: 'Signup Failed',
              detail: pendingErrorMessage,
              life: 5000,
            });
          }
        })
      ).subscribe({
        next: (response: any) => {
          console.log('Signup successful:', response);
          const userId = response?.data?.userDetail?.userId;
          if (userId) {
            this.localStorage.setItem('pendingVerificationUserId', userId);
          }
        },
        error: (error) => {
          console.error('Signup failed:', error);
          const errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Signup failed. Please try again.';

          if (this.isEmailAlreadyExistsError(error, errorMessage)) {
            void this.router.navigate(['account/confirm-account'], {
              queryParams: { email: req.email },
              state: { email: req.email },
            });
            return;
          }

          pendingErrorMessage = errorMessage;
        },
        complete: () => {
          console.log('Signup request completed');
          const userId = this.localStorage.getItem('pendingVerificationUserId');
          void this.router.navigate(['account/verify-email', this.signupForm.value.email], {
            queryParams: userId ? { uid: userId } : {},
          });
        },
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }

  isEmailAlreadyExistsError(error: any, errorMessage: string): boolean {
    const rawMsg = (
      errorMessage ||
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      ''
    ).toLowerCase();

    return (
      rawMsg.includes('already exist') ||
      rawMsg.includes('already registered') ||
      error?.status === 409
    );
  }
}
