import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

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
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  readonly data: DialogData = this.config.data ?? {};

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
