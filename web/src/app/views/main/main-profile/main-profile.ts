import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
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
  imports: [MatExpansionModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatBadgeModule, MatListModule, MatChipsModule, MatBottomSheetModule, MatDialogModule],
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
  public personalDetails: PersonalDetailsResponse | null = null;
  affiliatedOrganizationsCount = 0;
  isLoading = false;
  countries: RestCountriesSelection = [];

  ngOnInit(): void {
    this.isLoading = true;
    this.loadCountries();
    this.userService.getAuthenticatedUserDetails().subscribe({
      next: (response: any) => {
        this.personalDetails = response.data as PersonalDetailsResponse;
        console.log('Personal details:', this.personalDetails);
        if (this.personalDetails?.organizationAffiliation) {
          this.affiliatedOrganizationsCount = this.personalDetails.organizationAffiliation.count;
        }
        this.isLoading = false;
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch user details:', error);
        this.isLoading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  private loadCountries(): void {
    this.countryApiService.getCountries().subscribe({
      next: (countries: RestCountryList) => {
        this.countries = countries.map(country => ({
          name: country.name.common,
          cca2: country.cca2,
          currency: country.currencies && Object.values(country.currencies)[0]?.name || 'N/A'
        })).sort((a, b) => a.name.localeCompare(b.name));
        console.log('Loaded countries count:', this.countries.length);
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
      },
      complete: () => {
        console.log('Countries loading completed');
        console.log(this.countries);
      }
    });
  }

  openProfileImageDialog(): void {
    this.dialog.open(ProfileImageDialog);
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
