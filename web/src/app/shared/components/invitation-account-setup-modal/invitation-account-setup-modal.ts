import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { RadioButtonModule } from 'primeng/radiobutton';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { InvitationService } from '../../services/invitation-service';
import { LocalStorageService } from '../../services/local-storage-service';
import { UserService } from '../../services/user-service';
import {
  AcceptInvitationResponse,
  RegisterAndAcceptInvitationRequest,
} from '../../models/invitation';

@Component({
  selector: 'app-invitation-account-setup-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    RadioButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './invitation-account-setup-modal.html',
  styleUrl: './invitation-account-setup-modal.scss',
})
export class InvitationAccountSetupModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly invitationService = inject(InvitationService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly userService = inject(UserService);
  private readonly messageService = inject(MessageService);

  @Input() invitationToken = '';
  @Input() inviteeEmail = '';
  @Input() organizationDisplayName = '';
  @Input() organizationLegalName = '';
  @Input() role = '';

  @Output() readonly accountCreated = new EventEmitter<AcceptInvitationResponse>();

  step = signal<'prompt' | 'form'>('prompt');
  isSubmitting = signal(false);
  isClosing = signal(false);
  showPassword = signal(false);
  submitError = signal<string | null>(null);

  accountForm!: FormGroup;

  ngOnInit(): void {
    const email =
      this.inviteeEmail ||
      this.localStorage.getItem('pending_invitation_email') ||
      '';

    this.accountForm = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      password: ['', [Validators.required, this.passwordStrengthValidator()]],
    });
  }

  proceedToForm(): void {
    const email =
      this.inviteeEmail ||
      this.localStorage.getItem('pending_invitation_email') ||
      '';
    if (email) {
      this.accountForm.patchValue({ email });
    }
    this.step.set('form');
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  get passwordValue(): string {
    return this.accountForm?.get('password')?.value || '';
  }

  get passwordTouched(): boolean {
    const ctrl = this.accountForm?.get('password');
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

  onSubmit(): void {
    this.accountForm.markAllAsTouched();
    if (this.accountForm.invalid || this.isSubmitting()) {
      return;
    }

    const token =
      this.invitationToken ||
      this.localStorage.getItem('pending_invitation_token') ||
      '';
    const raw = this.accountForm.getRawValue();

    const payload: RegisterAndAcceptInvitationRequest = {
      token: token.trim(),
      email: (raw.email || '').trim(),
      firstName: (raw.firstName || '').trim(),
      lastName: (raw.lastName || '').trim(),
      gender: raw.gender,
      password: raw.password,
    };

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.invitationService
      .registerAndAcceptInvitation(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const data = response.data;
          if (data?.accessToken) {
            this.localStorage.setItem('access_token', data.accessToken);
          }
          if (data?.refreshToken) {
            this.localStorage.setItem('refresh_token', data.refreshToken);
          }
          this.localStorage.setItem('user_email', payload.email);
          this.userService.setAccountUnverified(true);

          this.localStorage.removeItem('pending_invitation_token');
          this.localStorage.removeItem('pending_invitation_email');
          this.localStorage.removeItem('pending_invitation_org_id');
          this.localStorage.removeItem('pending_invitation_org_name');
          this.localStorage.removeItem('pending_invitation_legal_name');
          this.localStorage.removeItem('pending_invitation_role');

          this.isClosing.set(true);
          setTimeout(() => {
            if (data) {
              this.accountCreated.emit(data);
            }
          }, 260);
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            'Failed to create account and accept invitation. Please try again.';
          this.submitError.set(msg);
          this.messageService.add({
            severity: 'error',
            summary: 'Registration Failed',
            detail: msg,
            life: 5000,
          });
        },
      });
  }
}
