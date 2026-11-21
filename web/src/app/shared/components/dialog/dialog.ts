import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

export interface DialogContextBadge {
  icon?: string;
  label: string;
  value: string;
  subValue?: string;
}

export interface DialogData {
  title: string;
  subtitle?: string;
  messages: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  confirmIcon?: string;
  cancelIcon?: string;
  hideCancel?: boolean;
  icon?: string;
  isHtml?: boolean;
  confirmColor?: 'primary' | 'accent' | 'warn';
  variant?: 'default' | 'signout';
  contextBadge?: DialogContextBadge;
  highlights?: string[];
  footnote?: string;
}

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './dialog.html',
  styleUrl: './dialog.scss',
})
export class Dialog {
  private readonly dialogRef = inject(DynamicDialogRef, { optional: true });
  private readonly config = inject(DynamicDialogConfig, { optional: true });
  readonly data: DialogData = this.config?.data ?? {
    title: '',
    messages: [],
  };

  get isSignOutVariant(): boolean {
    return (
      this.data.variant === 'signout' ||
      this.data.icon === 'pi pi-sign-out' ||
      this.data.icon === 'pi-sign-out' ||
      this.data.title?.toLowerCase().includes('sign out')
    );
  }

  get isWarnVariant(): boolean {
    return this.data.confirmColor === 'warn';
  }

  get resolvedIcon(): string {
    const raw = this.data.icon?.trim();
    if (!raw) {
      return this.isWarnVariant ? 'pi pi-exclamation-triangle' : 'pi pi-info-circle';
    }
    if (raw === 'warning') {
      return 'pi pi-exclamation-triangle';
    }
    return raw.startsWith('pi ') ? raw : `pi ${raw}`;
  }

  get defaultHighlights(): string[] {
    if (this.data.highlights && this.data.highlights.length > 0) {
      return this.data.highlights;
    }
    if (this.isSignOutVariant) {
      return [
        'Your active session token on this browser will be securely revoked.',
        'All saved accounting records and organization data remain safely stored.',
      ];
    }
    return [];
  }

  cancel(): void {
    this.dialogRef?.close(false);
  }

  confirm(): void {
    this.dialogRef?.close(true);
  }
}

