import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../shared/services/auth-service';
import { Config } from '../../shared/models/api_response';
import { PasswordResetTokenStatus } from '../../shared/models/auth';

type ViewState = 'checking' | 'form' | 'invalid' | 'done';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, InputTextModule, ButtonModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  private token = '';

  state = signal<ViewState>('checking');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordValue = signal('');
  readonly isDone = computed(() => this.state() === 'done');

  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, this.passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const newPasswordCtrl = this.resetForm.get('newPassword')!;
    const confirmCtrl = this.resetForm.get('confirmPassword')!;
    confirmCtrl.addValidators(this.confirmMatchValidator(newPasswordCtrl));
    newPasswordCtrl.valueChanges.subscribe((value: string) => {
      this.passwordValue.set(value || '');
      confirmCtrl.updateValueAndValidity({ emitEvent: false });
    });

    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.state.set('invalid');
      return;
    }

    this.authService.validateResetToken(this.token).subscribe({
      next: (res: Config) => {
        const status = res.success && 'data' in res ? (res.data as PasswordResetTokenStatus) : null;
        if (status?.valid) {
          this.state.set('form');
        } else if (status?.expired) {
          void this.router.navigate(['/account/link-expired'], { replaceUrl: true });
        } else {
          this.state.set('invalid');
        }
      },
      error: () => this.state.set('invalid'),
    });
  }

  get hasMinLength(): boolean {
    return this.passwordValue().length >= 8;
  }

  get hasUpperAndLower(): boolean {
    return /[a-z]/.test(this.passwordValue()) && /[A-Z]/.test(this.passwordValue());
  }

  get hasNumber(): boolean {
    return /\d/.test(this.passwordValue());
  }

  get hasSymbol(): boolean {
    return /[^A-Za-z0-9]/.test(this.passwordValue());
  }

  get passwordTouchedOrFilled(): boolean {
    const ctrl = this.resetForm.get('newPassword');
    return !!(ctrl?.touched || this.passwordValue().length > 0);
  }

  get confirmTouched(): boolean {
    const ctrl = this.resetForm.get('confirmPassword');
    return !!(ctrl?.dirty || ctrl?.touched);
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.resetForm.invalid || this.isSubmitting()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.authService
      .resetPassword({
        token: this.token,
        newPassword: this.resetForm.value.newPassword,
        confirmPassword: this.resetForm.value.confirmPassword,
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.state.set('done');
          this.messageService.add({
            severity: 'success',
            summary: 'Password updated',
            detail: 'You can now sign in with your new password.',
            life: 5000,
          });
        },
        error: (error) => {
          const message: string =
            error?.error?.message || 'Unable to reset your password. Please try again.';
          if (/has expired/i.test(message)) {
            void this.router.navigate(['/account/link-expired'], { replaceUrl: true });
            return;
          }
          if (/invalid/i.test(message)) {
            this.state.set('invalid');
            return;
          }
          this.errorMessage.set(message);
        },
      });
  }

  goToSignin(): void {
    void this.router.navigate(['/account/signin']);
  }

  private passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: string = control.value || '';
      if (!value) return null;
      const ok =
        value.length >= 8 &&
        /[a-z]/.test(value) &&
        /[A-Z]/.test(value) &&
        /\d/.test(value) &&
        /[^A-Za-z0-9]/.test(value);
      return ok ? null : { passwordRequirements: true };
    };
  }

  private confirmMatchValidator(passwordCtrl: AbstractControl): ValidatorFn {
    return (confirmCtrl: AbstractControl): ValidationErrors | null => {
      const confirm: string = confirmCtrl.value ?? '';
      if (!confirm) return null;
      return confirm !== (passwordCtrl.value ?? '') ? { passwordMismatch: true } : null;
    };
  }
}
