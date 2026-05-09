import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-contact-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <section class="create-contact-dialog">
      <h3 mat-dialog-title>Create New Contact</h3>

      <mat-dialog-content>
        <form class="contact-dialog-form">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>First Name</mat-label>
            <input matInput placeholder="John" />
          </mat-form-field>

          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Last Name</mat-label>
            <input matInput placeholder="Doe" />
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button matButton type="button" (click)="close()">Cancel</button>
        <button matButton="filled" type="button" (click)="close()">Create Contact</button>
      </mat-dialog-actions>
    </section>
  `,
  styles: [`
    .create-contact-dialog {
      min-width: min(92vw, 28rem);
    }

    .contact-dialog-form {
      display: grid;
      gap: 0.8rem;
      padding-top: 0.25rem;
    }

    .contact-dialog-form mat-form-field {
      width: 100%;
    }
  `],
})
export class CreateContactDialog {
  private readonly dialogRef = inject(MatDialogRef<CreateContactDialog>);

  close() {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-main-invoice',
  imports: [MatButtonModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatNativeDateModule, MatSelectModule, MatSnackBarModule],
  templateUrl: './main-invoice.html',
  styleUrl: './main-invoice.scss',
})
export class MainInvoice {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  invoiceDate = new Date();
  isNewInvoiceFormOpen = false;
  isSecondaryPanelOpen = false;
  lineItemsCount = 0;

  openCreateContactDialog() {
    this.dialog.open(CreateContactDialog);
  }

  toggleNewInvoiceForm() {
    this.isNewInvoiceFormOpen = !this.isNewInvoiceFormOpen;
  }

  openSecondaryPanel() {
    this.isSecondaryPanelOpen = true;
  }

  closeSecondaryPanel() {
    this.isSecondaryPanelOpen = false;
  }

  toggleSecondaryPanel() {
    this.isSecondaryPanelOpen = !this.isSecondaryPanelOpen;
  }

  submitInvoice() {
    this.snackBar.open('Invoice saved as draft.', 'Close', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
    this.isNewInvoiceFormOpen = false;
  }
}
