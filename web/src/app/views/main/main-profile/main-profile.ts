import { Component, ElementRef, OnDestroy, OnInit, QueryList, ViewChildren, ViewEncapsulation, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { SelectModule } from 'primeng/select';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Dialog, DialogData } from '../../../shared/components/dialog/dialog';
import { UserService } from '../../../shared/services/user-service';
import { LocalStorageService } from '../../../shared/services/local-storage-service';
import { PrincipalDetailsResponse } from '../../../shared/models/organization';
import { RestCountriesSelection, Config } from '../../../shared/models/api_response';
import { VerifiedAccountResponse } from '../../../shared/models/auth';
import { OrganizationService } from '../../../shared/services/organization-service';
import { UtilityService } from '../../../shared/services/utility-service';
import { AuthService } from '../../../shared/services/auth-service';

@Component({
  selector: 'app-profile-image-dialog',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <section class="profile-image-dialog">
      <div class="profile-image-placeholder">
        <i class="pi pi-user profile-image-icon"></i>
      </div>
      <div class="dialog-actions-row">
        <p-button label="Close" [size]="'small'" [outlined]="true" (click)="close()"></p-button>
        <p-button label="Upload Photo" [size]="'small'"></p-button>
      </div>
    </section>
  `,
  styles: [`
    .profile-image-dialog {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .profile-image-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1.5rem 0;
    }
    .profile-image-icon {
      font-size: 4rem;
      color: #94B4C1;
    }
    .dialog-actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
  `]
})
export class ProfileImageDialog {
  private readonly dialogRef = inject(DynamicDialogRef);

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [ButtonModule, PasswordModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="change-password-dialog">
      <p class="sheet-description">Set a new password for your account.</p>

      <div class="field-wrapper">
        <label class="field-label">Current password</label>
        <p-password [(ngModel)]="currentPassword" [feedback]="false" [toggleMask]="true" [size]="'small'" styleClass="full-width" [inputStyleClass]="'full-width'" placeholder="Enter current password"></p-password>
      </div>

      <div class="field-wrapper">
        <label class="field-label">New password</label>
        <p-password [(ngModel)]="newPassword" [toggleMask]="true" [size]="'small'" styleClass="full-width" [inputStyleClass]="'full-width'" placeholder="Enter new password"></p-password>
      </div>

      <div class="field-wrapper">
        <label class="field-label">Confirm new password</label>
        <p-password [(ngModel)]="confirmPassword" [feedback]="false" [toggleMask]="true" [size]="'small'" styleClass="full-width" [inputStyleClass]="'full-width'" placeholder="Re-enter new password"></p-password>
      </div>

      <p class="sheet-note">
        Once you change your password, you will be automatically logged out.<br>
        You will also receive an email with instructions on how to sign in again using your new password.
      </p>

      <div class="dialog-actions-row">
        <p-button label="Cancel" [outlined]="true" [size]="'small'" (click)="close()"></p-button>
        <p-button label="Update Password" severity="danger" [size]="'small'" (click)="close()"></p-button>
      </div>
    </section>
  `,
  styles: [`
    .change-password-dialog {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .sheet-description {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
    }
    .field-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .field-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
    }
    .sheet-note {
      margin: 0.5rem 0 0;
      font-size: 0.8rem;
      line-height: 1.45;
      color: #64748b;
    }
    .dialog-actions-row {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .full-width {
      width: 100%;
    }
  `]
})
export class ChangePasswordDialog {
  private readonly dialogRef = inject(DynamicDialogRef);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-main-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AccordionModule,
    AutoCompleteModule,
    SelectModule,
    BadgeModule,
    ChipModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './main-profile.html',
  styleUrl: './main-profile.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainProfile implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly organizationService = inject(OrganizationService);
  private readonly utilityService = inject(UtilityService);
  private readonly fb = inject(FormBuilder);

  @ViewChildren('pinInput') pinInputs!: QueryList<ElementRef<HTMLInputElement>>;

  public personalDetails: PrincipalDetailsResponse | null = null;
  affiliatedOrganizationsCount = 0;
  isLoading = false;
  isUpdating = false;
  isEditingEmail = false;
  isEditingCountry = false;
  isEditingName = false;
  isEditingGender = false;
  countries: RestCountriesSelection = [];
  filteredCountries: string[] = [];

  activeSection: 'personal' | 'settings' = 'personal';
  hasSentActivationPin = signal(false);
  pinDigits = signal<string[]>(['', '', '', '']);
  pinError = signal<string | null>(null);
  isActivatingPin = signal(false);
  isResendingPin = signal(false);
  resendCooldownSeconds = signal(0);
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  get isAccountActivated(): boolean {
    if (this.personalDetails && typeof this.personalDetails.isEnabled === 'boolean') {
      return this.personalDetails.isEnabled;
    }
    return !this.userService.isAccountUnverified();
  }

  get isPinComplete(): boolean {
    return this.pinDigits().every((d) => /^\d$/.test(d));
  }

  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  profileForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: ['', Validators.required],
    country: [''],
    email: ['', [Validators.required, Validators.email]],
  });

  get countryControl(): FormControl {
    return this.profileForm.get('country') as FormControl;
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.loadCountries();
    this.userService.getAuthenticatedUserDetails().subscribe({
      next: (response: any) => {
        this.personalDetails = response.data as PrincipalDetailsResponse;
        if (this.personalDetails?.organizationAffiliation) {
          this.affiliatedOrganizationsCount = this.personalDetails.organizationAffiliation.count || (this.personalDetails.organizationAffiliation.organizations?.length ?? 0);
        }
        const enabled = this.personalDetails?.isEnabled ?? this.personalDetails?.enabled;
        if (typeof enabled === 'boolean') {
          this.userService.setAccountUnverified(!enabled);
        }
        this.patchForm(this.personalDetails);
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  switchSection(section: 'personal' | 'settings'): void {
    this.activeSection = section;
    this.cdRef.detectChanges();
  }

  onPinDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.replace(/\D/g, '');
    this.pinError.set(null);

    if (!rawValue) {
      this.updatePinDigit(index, '');
      input.value = '';
      return;
    }

    const digit = rawValue.slice(-1);
    this.updatePinDigit(index, digit);
    input.value = digit;

    if (index < 3) {
      this.focusPinInput(index + 1);
    }
  }

  onPinKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      this.pinError.set(null);
      const currentDigits = this.pinDigits();
      if (currentDigits[index]) {
        this.updatePinDigit(index, '');
      } else if (index > 0) {
        this.updatePinDigit(index - 1, '');
        this.focusPinInput(index - 1);
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusPinInput(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < 3) {
      this.focusPinInput(index + 1);
      event.preventDefault();
    } else if (event.key === 'Enter' && this.isPinComplete) {
      this.activateAccountWithPin();
      event.preventDefault();
    }
  }

  onPinPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    this.applyPastedPin(pastedText);
  }

  async pastePinFromClipboard(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText();
      this.applyPastedPin(text);
    } catch {
      this.messageService.add({
        severity: 'info',
        summary: 'Paste PIN',
        detail: 'Press Ctrl+V (or Cmd+V) inside the PIN boxes to paste your 4-digit code.',
        life: 3500,
      });
    }
  }

  private applyPastedPin(rawText: string): void {
    const digitsOnly = (rawText || '').replace(/\D/g, '').slice(0, 4);
    if (!digitsOnly) {
      return;
    }
    this.pinError.set(null);
    const updated = [...this.pinDigits()];
    for (let i = 0; i < 4; i++) {
      updated[i] = digitsOnly[i] || '';
    }
    this.pinDigits.set(updated);

    const inputs = this.pinInputs?.toArray() || [];
    inputs.forEach((el, idx) => {
      el.nativeElement.value = updated[idx];
    });
    this.focusPinInput(Math.min(digitsOnly.length, 3));
    this.cdRef.detectChanges();
  }

  activateAccountWithPin(): void {
    const email = this.personalDetails?.email || this.localStorage.getItem('user_email') || '';
    if (!email) {
      this.pinError.set('Unable to determine your account email address.');
      return;
    }

    const pin = this.pinDigits().join('');
    if (!/^\d{4}$/.test(pin)) {
      this.pinError.set('Please enter the 4-digit PIN code sent to your email.');
      return;
    }

    if (this.isActivatingPin()) {
      return;
    }

    this.isActivatingPin.set(true);
    this.pinError.set(null);

    this.authService
      .verifyPin({ email, pin })
      .pipe(
        finalize(() => {
          this.isActivatingPin.set(false);
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response: Config) => {
          if (response.success && 'data' in response) {
            const verifiedData = (response as any).data as VerifiedAccountResponse;
            if (verifiedData?.accessToken) {
              this.localStorage.setItem('access_token', verifiedData.accessToken);
            }
          }

          if (this.personalDetails) {
            this.personalDetails = {
              ...this.personalDetails,
              isEnabled: true,
              enabled: true,
            };
          }
          this.userService.setAccountUnverified(false);

          this.messageService.add({
            severity: 'success',
            summary: 'Account Activated',
            detail: 'Your MERRA user account has been verified and activated successfully!',
            life: 5000,
          });
          this.cdRef.detectChanges();
        },
        error: (error) => {
          const msg =
            error?.error?.message ||
            error?.error?.error ||
            error?.message ||
            'Invalid or expired PIN code. Please check your email and try again.';
          this.pinError.set(msg);
          this.messageService.add({
            severity: 'error',
            summary: 'Activation Failed',
            detail: msg,
            life: 5000,
          });
          this.cdRef.detectChanges();
        },
      });
  }

  resendActivationPin(): void {
    const email = this.personalDetails?.email || this.localStorage.getItem('user_email') || '';
    if (!email || this.isResendingPin() || this.resendCooldownSeconds() > 0) {
      return;
    }

    const isFirstSend = !this.hasSentActivationPin();
    this.isResendingPin.set(true);
    this.authService
      .resendVerificationEmail({
        email,
        ...(this.personalDetails?.id ? { userId: this.personalDetails.id } : {}),
      })
      .pipe(
        finalize(() => {
          this.isResendingPin.set(false);
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.hasSentActivationPin.set(true);
          setTimeout(() => {
            this.clearPinBoxes();
            this.cdRef.detectChanges();
          }, 50);
          this.messageService.add({
            severity: 'success',
            summary: 'PIN Code Sent',
            detail: `A 4-digit activation PIN has been sent to ${email}.`,
            life: 5000,
          });
          if (!isFirstSend) {
            this.startResendCooldown(60);
          } else {
            this.startResendCooldown(30);
          }
        },
        error: (error) => {
          const msg =
            error?.error?.message ||
            error?.message ||
            'Failed to send activation PIN. Please try again.';
          this.messageService.add({
            severity: 'error',
            summary: 'Send Failed',
            detail: msg,
            life: 5000,
          });
        },
      });
  }

  private updatePinDigit(index: number, value: string): void {
    const updated = [...this.pinDigits()];
    updated[index] = value;
    this.pinDigits.set(updated);
  }

  private clearPinBoxes(): void {
    this.pinDigits.set(['', '', '', '']);
    this.pinError.set(null);
    const inputs = this.pinInputs?.toArray() || [];
    inputs.forEach((el) => {
      el.nativeElement.value = '';
    });
    this.focusPinInput(0);
  }

  private focusPinInput(index: number): void {
    const inputs = this.pinInputs?.toArray() || [];
    const target = inputs[index]?.nativeElement;
    if (target) {
      target.focus();
      target.select();
    }
  }

  private startResendCooldown(seconds: number): void {
    this.resendCooldownSeconds.set(seconds);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      this.resendCooldownSeconds.update((s) => {
        if (s <= 1) {
          if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = null;
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  private patchForm(details: PrincipalDetailsResponse | null): void {
    if (!details) return;
    this.profileForm.patchValue({
      firstName: details.firstName ?? '',
      lastName: details.lastName ?? '',
      gender: details.gender?.toLowerCase() ?? '',
      country: details.country ?? '',
      email: details.email ?? '',
    }, { emitEvent: false });
    this.profileForm.markAsPristine();
  }

  updateProfile(): void {
    if (this.profileForm.invalid || this.profileForm.pristine) return;
    const value = this.profileForm.getRawValue();
    const payload: PrincipalDetailsResponse = {
      ...this.personalDetails!,
      firstName: value.firstName,
      lastName: value.lastName,
      gender: value.gender,
      country: value.country,
      email: value.email,
    };
    this.isUpdating = true;
    this.userService.updateProfile(payload).subscribe({
      next: (response: any) => {
        this.personalDetails = response.data as PrincipalDetailsResponse;
        this.patchForm(this.personalDetails);
        this.isUpdating = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully', life: 3000 });
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.isUpdating = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update profile', life: 5000 });
        this.cdRef.detectChanges();
      },
    });
  }

  searchCountry(event: any): void {
    const query = (event.query || '').toLowerCase().trim();
    if (!query) {
      this.filteredCountries = this.countries.map(c => c.name);
    } else {
      this.filteredCountries = this.countries
        .filter(c => (c.name && c.name.toLowerCase().includes(query)) || (c.cca2 && c.cca2.toLowerCase().includes(query)))
        .map(c => c.name);
    }
  }

  private loadCountries(): void {
    this.utilityService.getCountries().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response && Array.isArray(response.data)) {
          const countryList = response.data as any[];
          this.countries = countryList
            .map(c => ({
              name: c.countryName || c.common || c.official || c.name || '',
              cca2: c.isoAlpha2Code || c.alpha2 || c.cca2 || '',
              currency: c.code || c.symbol || 'N/A'
            }))
            .filter(c => !!c.name && !!c.cca2)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          this.cdRef.detectChanges();
        }
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
      }
    });
  }

  openProfileImageDialog(): void {
    this.dialogService.open(ProfileImageDialog, {
      header: 'Profile Picture',
      width: '380px'
    });
  }

  openEmailChangeDialog(): void {
    const data: DialogData = {
      title: 'Change Email Address',
      messages: [
        'Changing your email address will log you out of your account.',
        'You will need to sign in again using your new email address to continue.',
        'Note: You can only change your email address once every 2 months.',
      ],
      confirmLabel: 'Proceed',
    };
    const dialogRef = this.dialogService.open(Dialog, { data, header: 'Change Email Address', width: '420px' });
    dialogRef?.onClose.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.updateProfile();
        this.isEditingEmail = false;
      }
    });
  }

  openChangePasswordSheet(): void {
    this.dialogService.open(ChangePasswordDialog, {
      header: 'Change Password',
      width: '420px'
    });
  }

  onLogout(): void {
    const ref = this.dialogService.open(Dialog, {
      header: 'Confirm Sign Out',
      width: '420px',
      modal: true,
      data: {
        title: 'Sign Out',
        messages: ['Are you sure you want to sign out of your account?'],
        confirmLabel: 'Sign Out',
        cancelLabel: 'Cancel',
        confirmColor: 'warn',
        icon: 'pi pi-sign-out',
      },
    });

    if (ref) {
      ref.onClose.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.authService.logout().subscribe();
        }
      });
    }
  }

  getGenderDisplay(): string {
    const g = this.personalDetails?.gender?.toLowerCase();
    if (g === 'm' || g === 'male') return 'Male';
    if (g === 'f' || g === 'female') return 'Female';
    return this.personalDetails?.gender || 'Not set';
  }

  getCountryDisplay(): string {
    const code = this.personalDetails?.country;
    if (!code) return 'Not set';
    const found = this.countries.find(
      c => c.cca2?.toLowerCase() === code.toLowerCase() || c.name?.toLowerCase() === code.toLowerCase()
    );
    return found ? `${found.name} (${found.cca2})` : code;
  }
}
