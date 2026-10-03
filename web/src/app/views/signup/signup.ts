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

  signupForm: FormGroup;
  isSubmitting = signal(false);

  constructor() {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
      ]],
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

  confirmMatchValidator(passwordCtrl: AbstractControl): ValidatorFn {
    return (confirmCtrl: AbstractControl): ValidationErrors | null => {
      const password: string = passwordCtrl.value ?? '';
      const confirm: string = confirmCtrl.value ?? '';
      if (!confirm) return null;
      if (confirm.length > password.length || confirm !== password.slice(0, confirm.length) || (confirm.length === password.length && confirm !== password)) {
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
        next: (response) => {
          console.log('Signup successful:', response);
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
          void this.router.navigate(['account/verify-email', this.signupForm.value.email]);
        },
      });
    } else {
      this.signupForm.markAllAsTouched();
    }
  }
}
