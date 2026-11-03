import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { PrincipalDetailsResponse } from '../../../shared/models/organization';
import { RestCountriesSelection, Config } from '../../../shared/models/api_response';
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
export class MainProfile implements OnInit {
  private userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly organizationService = inject(OrganizationService);
  private readonly utilityService = inject(UtilityService);
  private readonly fb = inject(FormBuilder);
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

  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' }
  ];

  profileForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    gender: ['', Validators.required],
    country: ['', Validators.required],
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
