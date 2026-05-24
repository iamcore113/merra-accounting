import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Dialog, DialogData } from '../../../shared/components/dialog/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { UserService } from '../../../shared/services/user-service';
import { CountryApiService } from '../../../shared/services/country-api-service';
import { PersonalDetailsResponse } from '../../../shared/models/organization';
import { RestCountriesSelection, RestCountryList } from '../../../shared/models/api_response';

@Component({
  selector: 'app-profile-image-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <section class="profile-image-dialog">
      <h3 mat-dialog-title>Profile Picture</h3>
      <mat-dialog-content>
        <div class="profile-image-placeholder">
          <mat-icon class="profile-image-icon">account_circle</mat-icon>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" (click)="close()">Close</button>
        <button matButton="filled" type="button">Upload Photo</button>
      </mat-dialog-actions>
    </section>
  `,
})
export class ProfileImageDialog {
  private readonly dialogRef = inject(MatDialogRef<ProfileImageDialog>);

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-change-password-sheet',
  standalone: true,
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <section class="change-password-sheet">
      <h3 class="sheet-title">Change Password</h3>
      <p class="sheet-description">Set a new password for your account.</p>

      <mat-form-field class="sheet-form-field">
        <mat-label>Current password</mat-label>
        <input matInput type="password" placeholder="Enter current password">
      </mat-form-field>

      <mat-form-field class="sheet-form-field">
        <mat-label>New password</mat-label>
        <input matInput [type]="showNewPassword ? 'text' : 'password'" placeholder="Enter new password">
        <button
          mat-icon-button
          matSuffix
          type="button"
          [attr.aria-label]="showNewPassword ? 'Hide new password' : 'Show new password'"
          (click)="toggleNewPasswordVisibility()">
          <mat-icon>{{ showNewPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>

      <mat-form-field class="sheet-form-field">
        <mat-label>Confirm new password</mat-label>
        <input matInput [type]="showConfirmPassword ? 'text' : 'password'" placeholder="Re-enter new password">
        <button
          mat-icon-button
          matSuffix
          type="button"
          [attr.aria-label]="showConfirmPassword ? 'Hide confirm new password' : 'Show confirm new password'"
          (click)="toggleConfirmPasswordVisibility()">
          <mat-icon>{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>

      <p class="sheet-note">
        Once you change your password, you will be automatically logged out.<br>
        You will also receive an email with instructions on how to sign in again <br> using your new password.
      </p>

      <div class="sheet-actions">
        <button matButton="filled" type="button" (click)="close()">Update Password</button>
      </div>
    </section>
  `,
})
export class ChangePasswordSheet {
  private readonly bottomSheetRef = inject(MatBottomSheetRef<ChangePasswordSheet>);
  showNewPassword = false;
  showConfirmPassword = false;

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  close(): void {
    this.bottomSheetRef.dismiss();
  }
}

@Component({
  selector: 'app-main-profile',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatBadgeModule, MatListModule, MatChipsModule, MatBottomSheetModule, MatDialogModule, MatAutocompleteModule, AsyncPipe, ReactiveFormsModule],
  templateUrl: './main-profile.html',
  styleUrl: './main-profile.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainProfile implements OnInit {
  private userService = inject(UserService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly dialog = inject(MatDialog);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly countryApiService = inject(CountryApiService);
  private readonly fb = inject(FormBuilder);
  public personalDetails: PersonalDetailsResponse | null = null;
  affiliatedOrganizationsCount = 0;
  isLoading = false;
  isUpdating = false;
  isEditingEmail = false;
  isEditingCountry = false;
  isEditingName = false;
  isEditingGender = false;
  countries: RestCountriesSelection = [];

  profileForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    gender:    ['', Validators.required],
    country:   ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
  });

  get countryControl(): FormControl {
    return this.profileForm.get('country') as FormControl;
  }

  filteredCountries: Observable<RestCountriesSelection> = this.profileForm.get('country')!.valueChanges.pipe(
    startWith(''),
    map(value => this._filterCountries(value ?? ''))
  );

  ngOnInit(): void {
    this.isLoading = true;
    this.loadCountries();
    this.userService.getAuthenticatedUserDetails().subscribe({
      next: (response: any) => {
        this.personalDetails = response.data as PersonalDetailsResponse;
        if (this.personalDetails?.organizationAffiliation) {
          this.affiliatedOrganizationsCount = this.personalDetails.organizationAffiliation.count;
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

  private patchForm(details: PersonalDetailsResponse | null): void {
    if (!details) return;
    this.profileForm.patchValue({
      firstName: details.firstName ?? '',
      lastName:  details.lastName  ?? '',
      gender:    details.gender?.toLowerCase() ?? '',
      country:   details.country   ?? '',
      email:     details.email     ?? '',
    }, { emitEvent: false });
    this.profileForm.markAsPristine();
  }

  updateProfile(): void {
    if (this.profileForm.invalid || this.profileForm.pristine) return;
    const value = this.profileForm.getRawValue();
    const payload: PersonalDetailsResponse = {
      ...this.personalDetails!,
      firstName: value.firstName,
      lastName:  value.lastName,
      gender:    value.gender,
      country:   value.country,
      email:     value.email,
    };
    this.isUpdating = true;
    this.userService.updateProfile(payload).subscribe({
      next: (response: any) => {
        this.personalDetails = response.data as PersonalDetailsResponse;
        this.patchForm(this.personalDetails);
        this.isUpdating = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.isUpdating = false;
        this.cdRef.detectChanges();
      },
    });
  }

  private _filterCountries(value: string): RestCountriesSelection {
    const filterValue = value.toLowerCase();
    return this.countries.filter(c => c.name.toLowerCase().includes(filterValue));
  }

  private loadCountries(): void {
    this.countryApiService.getCountries().subscribe({
      next: (countries: RestCountryList) => {
        this.profileForm.get('country')!.setValue(this.personalDetails?.country ?? '', { emitEvent: false });
        this.countries = countries.map(country => ({
          name: country.name.common,
          cca2: country.cca2,
          currency: country.currencies && Object.values(country.currencies)[0]?.name || 'N/A'
        })).sort((a, b) => a.name.localeCompare(b.name));
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
      }
    });
  }

  openProfileImageDialog(): void {
    this.dialog.open(ProfileImageDialog);
  }

  openEmailChangeDialog(closePanel: () => void): void {
    const data: DialogData = {
      title: 'Change Email Address',
      messages: [
        'Changing your email address will log you out of your account.',
        'You will need to sign in again using your new email address to continue.',
        'Note: You can only change your email address once every 2 months.',
      ],
      confirmLabel: 'Proceed',
    };
    const dialogRef = this.dialog.open(Dialog, { data });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.updateProfile();
        this.isEditingEmail = false;
        closePanel();
      }
    });
  }

  openChangePasswordSheet(): void {
    this.bottomSheet.open(ChangePasswordSheet);
  }

  getGenderLetter(): string {
    if (!this.personalDetails?.gender) {
      return 'Not set';
    }
    return this.personalDetails.gender.charAt(0).toUpperCase();
  }
}
