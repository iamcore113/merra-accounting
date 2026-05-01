import { Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';

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
  imports: [MatExpansionModule, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule, MatBadgeModule, MatListModule, MatChipsModule, MatBottomSheetModule],
  templateUrl: './main-profile.html',
  styleUrl: './main-profile.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainProfile {
  private readonly bottomSheet = inject(MatBottomSheet);

  openChangePasswordSheet(): void {
    this.bottomSheet.open(ChangePasswordSheet);
  }
}
