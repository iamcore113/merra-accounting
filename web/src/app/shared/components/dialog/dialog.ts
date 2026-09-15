import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DialogData {
  title: string;
  messages: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  icon?: string;
  isHtml?: boolean;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  private readonly dialogRef = inject(MatDialogRef<Dialog>);
  readonly data: DialogData = inject(MAT_DIALOG_DATA);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
