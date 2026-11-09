import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { CurrentOrganizationResponse } from '../../../shared/models/organization';

export interface OrganizationProfileDialogData {
  organization?: CurrentOrganizationResponse;
  typeName?: string;
  countryDisplay?: string;
  financialYearDisplay?: string;
}

@Component({
  selector: 'app-organization-profile-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, TagModule, DatePipe],
  template: `
    <section class="organization-profile-dialog">
      <!-- Profile Hero Banner -->
      <div class="profile-hero">
        <div class="avatar-wrapper">
          @if (customLogoUrl) {
            <img [src]="customLogoUrl" alt="Organization Logo" class="profile-avatar-img" />
          } @else {
            <div class="profile-avatar-fallback">
              <span class="avatar-initials">{{ getInitials() }}</span>
              <i class="pi pi-building avatar-icon"></i>
            </div>
          }
          <span class="status-indicator-dot" title="Active Organization"></span>
        </div>

        <div class="hero-details">
          <div class="hero-title-row">
            <h3 class="hero-display-name">{{ organization?.names?.displayName || 'Organization Profile' }}</h3>
            <span class="status-badge">
              <i class="pi pi-check-circle"></i> Active
            </span>
          </div>

          <p class="hero-legal-name">{{ organization?.names?.legalName || 'Legal Name not configured' }}</p>

          <div class="hero-tags">
            <span class="type-pill">
              <i class="pi pi-tag"></i> {{ typeName || 'Business Organization' }}
            </span>
            @if (countryDisplay) {
              <span class="country-pill">
                <i class="pi pi-map-marker"></i> {{ countryDisplay }}
              </span>
            }
          </div>
        </div>
      </div>

      <!-- Identity & Tenant ID Card -->
      <div class="tenant-id-card">
        <div class="tenant-id-left">
          <span class="tenant-label">Organization Identifier</span>
          <code class="tenant-code">{{ organization?.organizationId || '—' }}</code>
        </div>
        <button
          type="button"
          class="copy-id-btn"
          pTooltip="Copy Organization ID"
          tooltipPosition="top"
          (click)="copyOrganizationId()">
          <i class="pi pi-copy"></i>
          <span>{{ copiedId ? 'Copied!' : 'Copy' }}</span>
        </button>
      </div>

      <!-- Overview Information Grid -->
      <div class="profile-meta-grid">
        <div class="meta-item">
          <div class="meta-icon-wrap">
            <i class="pi pi-envelope"></i>
          </div>
          <div class="meta-text">
            <span class="meta-label">Primary Contact Email</span>
            <span class="meta-value" [title]="organization?.address?.email || 'Not set'">
              {{ organization?.address?.email || '—' }}
            </span>
          </div>
        </div>

        <div class="meta-item">
          <div class="meta-icon-wrap">
            <i class="pi pi-globe"></i>
          </div>
          <div class="meta-text">
            <span class="meta-label">Website</span>
            @if (organization?.website) {
              <a [href]="getSafeUrl(organization?.website)" target="_blank" rel="noopener noreferrer" class="meta-value meta-link">
                {{ organization?.website }} <i class="pi pi-external-link"></i>
              </a>
            } @else {
              <span class="meta-value">—</span>
            }
          </div>
        </div>

        <div class="meta-item">
          <div class="meta-icon-wrap">
            <i class="pi pi-dollar"></i>
          </div>
          <div class="meta-text">
            <span class="meta-label">Default Currency</span>
            <span class="meta-value">{{ organization?.address?.currency || '—' }}</span>
          </div>
        </div>

        <div class="meta-item">
          <div class="meta-icon-wrap">
            <i class="pi pi-clock"></i>
          </div>
          <div class="meta-text">
            <span class="meta-label">Timezone</span>
            <span class="meta-value">{{ organization?.address?.timeZone || '—' }}</span>
          </div>
        </div>

        <div class="meta-item">
          <div class="meta-icon-wrap">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="meta-text">
            <span class="meta-label">Created Date</span>
            <span class="meta-value">{{ organization?.createdDate ? (organization?.createdDate | date: 'mediumDate') : '—' }}</span>
          </div>
        </div>

        <div class="meta-item">
          <div class="meta-icon-wrap">
            <i class="pi pi-chart-pie"></i>
          </div>
          <div class="meta-text">
            <span class="meta-label">Financial Year Closing</span>
            <span class="meta-value">{{ financialYearDisplay || '—' }}</span>
          </div>
        </div>
      </div>

      <!-- Description Block -->
      @if (organization?.names?.description) {
        <div class="profile-about-block">
          <h4 class="about-title">About this organization</h4>
          <p class="about-text">{{ organization?.names?.description }}</p>
        </div>
      }

      <!-- Logo & Branding Customization UI -->
      <div class="branding-upload-section">
        <div class="branding-header">
          <h4 class="branding-title">Organization Brand Logo</h4>
          <p class="branding-subtitle">Upload a company logo or emblem to display across documents, invoices, and member dashboards.</p>
        </div>

        <div class="branding-actions-row">
          <input
            #fileInput
            type="file"
            accept="image/png, image/jpeg, image/svg+xml, image/webp"
            (change)="onFileSelected($event)"
            style="display: none" />

          <p-button
            label="Upload Logo"
            icon="pi pi-upload"
            [size]="'small'"
            [outlined]="true"
            (click)="fileInput.click()"></p-button>

          @if (customLogoUrl) {
            <p-button
              label="Remove Logo"
              icon="pi pi-trash"
              [size]="'small'"
              severity="danger"
              [text]="true"
              (click)="removeLogo()"></p-button>
          }

          <span class="upload-hint">PNG, JPG, SVG or WEBP up to 2MB</span>
        </div>
      </div>

      <!-- Dialog Footer -->
      <div class="dialog-footer">
        <p-button label="Close" [size]="'small'" [outlined]="true" (click)="close()"></p-button>
      </div>
    </section>
  `,
  styles: [`
    .organization-profile-dialog {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 0.25rem 0.5rem 0.5rem;
      color: #1e293b;
    }

    .profile-hero {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 8px;

      .avatar-wrapper {
        position: relative;
        flex-shrink: 0;

        .profile-avatar-img {
          width: 76px;
          height: 76px;
          border-radius: 12px;
          object-fit: cover;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
        }

        .profile-avatar-fallback {
          width: 76px;
          height: 76px;
          border-radius: 12px;
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;

          .avatar-initials {
            font-size: 1.25rem;
            font-weight: 800;
            color: #2e7d32;
            letter-spacing: 0.05em;
          }

          .avatar-icon {
            font-size: 0.85rem;
            color: #4caf50;
          }
        }

        .status-indicator-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #22c55e;
          border: 2px solid #ffffff;
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
        }
      }

      .hero-details {
        flex: 1;
        min-width: 0;

        .hero-title-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;

          .hero-display-name {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.01em;
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.72rem;
            font-weight: 600;
            color: #166534;
            background-color: #dcfce7;
            padding: 0.15rem 0.55rem;
            border-radius: 9999px;
            border: 1px solid #bbf7d0;

            i {
              font-size: 0.72rem;
            }
          }
        }

        .hero-legal-name {
          margin: 0.25rem 0 0.65rem;
          font-size: 0.84rem;
          color: #64748b;
          font-weight: 500;
        }

        .hero-tags {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;

          .type-pill,
          .country-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #475569;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 0.2rem 0.6rem;
            border-radius: 4px;

            i {
              font-size: 0.75rem;
              color: #689D4B;
            }
          }
        }
      }
    }

    .tenant-id-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;

      .tenant-id-left {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;

        .tenant-label {
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #64748b;
        }

        .tenant-code {
          font-size: 0.8125rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #1e293b;
          font-weight: 600;
          word-break: break-all;
        }
      }

      .copy-id-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.4rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
        flex-shrink: 0;

        &:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #94a3b8;
        }

        i {
          font-size: 0.75rem;
          color: #689D4B;
        }
      }
    }

    .profile-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.85rem;

      @media (max-width: 540px) {
        grid-template-columns: 1fr;
      }

      .meta-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;

        .meta-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #689D4B;

          i {
            font-size: 0.875rem;
          }
        }

        .meta-text {
          display: flex;
          flex-direction: column;
          min-width: 0;

          .meta-label {
            font-size: 0.72rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .meta-value {
            font-size: 0.84rem;
            font-weight: 600;
            color: #1e293b;
            margin-top: 0.15rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &.meta-link {
              color: #2563eb;
              text-decoration: none;
              display: inline-flex;
              align-items: center;
              gap: 0.25rem;

              &:hover {
                text-decoration: underline;
              }

              i {
                font-size: 0.7rem;
              }
            }
          }
        }
      }
    }

    .profile-about-block {
      padding: 0.85rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;

      .about-title {
        margin: 0 0 0.35rem;
        font-size: 0.8125rem;
        font-weight: 700;
        color: #334155;
      }

      .about-text {
        margin: 0;
        font-size: 0.84rem;
        line-height: 1.5;
        color: #475569;
      }
    }

    .branding-upload-section {
      padding: 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #ffffff;

      .branding-header {
        margin-bottom: 0.75rem;

        .branding-title {
          margin: 0 0 0.25rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: #1e293b;
        }

        .branding-subtitle {
          margin: 0;
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.4;
        }
      }

      .branding-actions-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;

        .upload-hint {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.5rem;
    }
  `]
})
export class OrganizationProfileDialog {
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  private readonly messageService = inject(MessageService);

  get organization(): CurrentOrganizationResponse | undefined {
    return this.config.data?.organization;
  }

  get typeName(): string {
    return this.config.data?.typeName || '';
  }

  get countryDisplay(): string {
    return this.config.data?.countryDisplay || '';
  }

  get financialYearDisplay(): string {
    return this.config.data?.financialYearDisplay || '';
  }

  customLogoUrl: string | null = null;
  copiedId = false;

  getInitials(): string {
    const name = this.organization?.names?.displayName || '';
    if (!name) return 'MO';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  getSafeUrl(url?: string): string {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  copyOrganizationId(): void {
    const id = this.organization?.organizationId;
    if (!id) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        this.copiedId = true;
        setTimeout(() => (this.copiedId = false), 2000);
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: 'Organization ID copied to clipboard',
          life: 2000,
        });
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.messageService.add({
          severity: 'warn',
          summary: 'File Too Large',
          detail: 'Logo image must be smaller than 2MB',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.customLogoUrl = e.target?.result as string;
        this.messageService.add({
          severity: 'success',
          summary: 'Logo Updated',
          detail: 'Organization logo preview updated',
          life: 2500,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.customLogoUrl = null;
    this.messageService.add({
      severity: 'info',
      summary: 'Logo Removed',
      detail: 'Reverted to default organization avatar',
      life: 2000,
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

// Alias for backward compatibility
export const OrganizationImageDialog = OrganizationProfileDialog;
