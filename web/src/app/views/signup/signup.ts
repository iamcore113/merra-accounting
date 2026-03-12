import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth-service';
import { CreateAccountRequest } from '../../shared/models/auth';

@Component({
  selector: 'app-signup',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSnackBarModule
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  auth_service = inject(AuthService);
  snackBar = inject(MatSnackBar);
  router = inject(Router);
  signupForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isSubmitting = signal(false);

  constructor(private fb: FormBuilder) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmPassword: ['', [Validators.required]],
      gender: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility() {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  onSubmit() {
    if (this.signupForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      let pendingErrorMessage: string | null = null;

      const req: CreateAccountRequest = {
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
        gender: this.signupForm.value.gender
      };
      this.auth_service.signup(req).pipe(
        finalize(() => {
          this.isSubmitting.set(false);

          if (pendingErrorMessage) {
            this.snackBar.open(pendingErrorMessage, 'Close', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          }
        })
      ).subscribe({
        next: (response) => {
          console.log('Signup successful:', response);
          // Add your signup logic here
        },
        error: (error) => {
          console.error('Signup failed:', error);
          const errorMessage =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Signup failed. Please try again.';
          pendingErrorMessage = errorMessage;
        },
        complete: () => {
          console.log('Signup request completed');
          void this.router.navigate(['/account/verify-email']);
        }
      });
    }
  }
}
