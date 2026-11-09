import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { NetworkKeyService } from '../../../shared/services/network-key-service';
import { NetworkKeyResponse } from '../../../shared/models/network-key';

@Component({
  selector: 'app-main-network-key',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    SkeletonModule,
  ],
  templateUrl: './main-network-key.html',
  styleUrl: './main-network-key.scss',
})
export class MainNetworkKey implements OnInit {
  private readonly networkKeyService = inject(NetworkKeyService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  keys: NetworkKeyResponse[] = [];
  isLoading = true;
  isGenerating = false;
  isDeleting = false;

  // Key visibility toggles (keyId -> boolean)
  visibleKeys: Record<string, boolean> = {};

  // Delete dialog state
  showDeleteDialog = false;
  selectedKeyToDelete: NetworkKeyResponse | null = null;

  // New key dialog state
  showCreateDialog = false;
  newKeyName = 'Primary Network Key';

  ngOnInit(): void {
    this.loadKeys();
  }

  loadKeys(): void {
    this.isLoading = true;
    this.networkKeyService.getActiveKeys().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.keys = res.data;
        } else {
          this.keys = [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load network keys',
        });
        this.cdr.markForCheck();
      },
    });
  }

  openCreateDialog(): void {
    this.newKeyName = 'Primary Network Key';
    this.showCreateDialog = true;
  }

  generateKey(): void {
    this.isGenerating = true;
    this.networkKeyService.generateNetworkKey({ name: this.newKeyName }).subscribe({
      next: (res) => {
        this.isGenerating = false;
        this.showCreateDialog = false;
        if (res.success && res.data) {
          this.keys = [res.data, ...this.keys];
          this.messageService.add({
            severity: 'success',
            summary: 'Key Generated',
            detail: 'Merra Network Key has been generated successfully',
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isGenerating = false;
        const msg = err.error?.message || err.message || 'Failed to generate network key';
        this.messageService.add({
          severity: 'error',
          summary: 'Generation Failed',
          detail: msg,
        });
        this.cdr.markForCheck();
      },
    });
  }

  toggleKeyVisibility(keyId: string): void {
    this.visibleKeys[keyId] = !this.visibleKeys[keyId];
  }

  isKeyVisible(keyId: string): boolean {
    return !!this.visibleKeys[keyId];
  }

  getMaskedKey(key: string, isVisible: boolean): string {
    if (isVisible) return key;
    if (key.length <= 16) return '••••••••••••••••';
    return key.slice(0, 9) + '••••••••••••••••' + key.slice(-4);
  }

  copyKeyToClipboard(key: string): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(key).then(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: 'Network Key copied to clipboard',
          life: 2000,
        });
      });
    } else {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = key;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.messageService.add({
        severity: 'info',
        summary: 'Copied',
        detail: 'Network Key copied to clipboard',
        life: 2000,
      });
    }
  }

  openDeleteDialog(key: NetworkKeyResponse): void {
    this.selectedKeyToDelete = key;
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
    this.selectedKeyToDelete = null;
  }

  confirmDelete(): void {
    if (!this.selectedKeyToDelete) return;
    this.isDeleting = true;
    const keyId = this.selectedKeyToDelete.id;

    this.networkKeyService.deleteNetworkKey(keyId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.keys = this.keys.filter((k) => k.id !== keyId);
        this.selectedKeyToDelete = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Revoked',
          detail: 'Network key was revoked successfully',
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeleting = false;
        const msg = err.error?.message || err.message || 'Failed to revoke key';
        this.messageService.add({
          severity: 'error',
          summary: 'Revoke Failed',
          detail: msg,
        });
        this.cdr.markForCheck();
      },
    });
  }
}
