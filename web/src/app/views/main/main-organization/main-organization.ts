import { Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-organization-image-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <section class="organization-image-dialog">
      <h3 mat-dialog-title>Organization Profile</h3>
      <mat-dialog-content>
        <div class="organization-image-placeholder">
          <mat-icon class="organization-image-icon" fontSet="material-icons-outlined">domain</mat-icon>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" (click)="close()">Close</button>
      </mat-dialog-actions>
    </section>
  `,
})
export class OrganizationImageDialog {
  private readonly dialogRef = inject(MatDialogRef<OrganizationImageDialog>);

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-main-organization',
  imports: [MatExpansionModule, MatIconModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './main-organization.html',
  styleUrl: './main-organization.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainOrganization {
  private readonly dialog = inject(MatDialog);
  currencyCode = 'BRL';

  openOrganizationImageDialog(): void {
    this.dialog.open(OrganizationImageDialog);
  }
}
