import { Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
  imports: [MatExpansionModule, MatIconModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  templateUrl: './main-organization.html',
  styleUrl: './main-organization.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainOrganization {
  private readonly dialog = inject(MatDialog);
  currencyCode = 'BRL';
  organizationDescription = 'The wolverine is found primarily in remote reaches of the northern boreal forests and subarctic and alpine tundra of the Northern Hemisphere, with the greatest numbers in Northern Canada, the U.S. state of Alaska, the mainland Nordic countries of Europe, and throughout western Russia and Siberia. Its population has steadily declined since the 19th century owing to trapping, range reduction and habitat fragmentation. The wolverine has become essentially absent from the southern end of its range in both Europe and North America.';
  isEditingDescription = false;

  openOrganizationImageDialog(): void {
    this.dialog.open(OrganizationImageDialog);
  }

  startDescriptionEditing(): void {
    this.isEditingDescription = true;
  }
}
