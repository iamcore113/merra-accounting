import { Component, OnInit, ViewEncapsulation, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { OrganizationService } from '../../../../shared/services/organization-service';
import { NetworkKeyService } from '../../../../shared/services/network-key-service';
import { InvitationService } from '../../../../shared/services/invitation-service';
import { UtilityService } from '../../../../shared/services/utility-service';
import { LocalStorageService } from '../../../../shared/services/local-storage-service';
import {
  CurrentOrganizationResponse,
  OrganizationMetaDataResponse,
  OrganizationTypesMetaData,
  CurrentOrganizationResponseContactAddress,
  CurrentOrganizationResponseExternalLink
} from '../../../../shared/models/organization';
import { Config } from '../../../../shared/models/api_response';

export interface ProfileSocialLink {
  platform: 'FACEBOOK' | 'X' | 'INSTAGRAM' | 'LINKEDIN';
  label: string;
  url: string;
}

@Component({
  selector: 'app-organization-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    TagModule,
    SkeletonModule,
    DatePipe
  ],
  templateUrl: './organization-profile.html',
  styleUrl: './organization-profile.scss',
  encapsulation: ViewEncapsulation.None
})
export class OrganizationProfile implements OnInit {
  public organizationService = inject(OrganizationService);
  private readonly networkKeyService = inject(NetworkKeyService);
  private readonly invitationService = inject(InvitationService);
  private readonly utilityService = inject(UtilityService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentOrganization: CurrentOrganizationResponse | undefined;
  organizationTypesMetadata: OrganizationTypesMetaData[] = [];
  countries: any[] = [];

  isLoadingOrganization = false;
  isLoadingOrganizationTypes = false;
  isLoadingCountries = false;
  isLoadingNetworkKeys = false;
  isLoadingInvitations = false;

  networkKeysCount = 0;
  invitationsCount = 0;
  copiedId = false;
  customLogoUrl: string | null = null;

  addresses: CurrentOrganizationResponseContactAddress[] = [];
  externalLinks: ProfileSocialLink[] = [];

  private readonly supportedPlatforms: { type: 'FACEBOOK' | 'X' | 'INSTAGRAM' | 'LINKEDIN'; label: string }[] = [
    { type: 'FACEBOOK', label: 'Facebook' },
    { type: 'X', label: 'X (Twitter)' },
    { type: 'INSTAGRAM', label: 'Instagram' },
    { type: 'LINKEDIN', label: 'LinkedIn' }
  ];

  private monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  ngOnInit(): void {
    this.isLoadingOrganization = true;
    this.loadCountries();
    this.loadOrganizationMetadata();
    this.loadOrganization();
    this.loadNetworkKeysCount();
    this.loadInvitationsCount();
    this.loadStoredLogo();
  }

  loadOrganization(): void {
    this.isLoadingOrganization = true;
    this.organizationService.getCurrentOrganization().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.addresses = [...(this.currentOrganization.address?.addresses || [])];
          this.externalLinks = this.mapExternalLinks(this.currentOrganization.externalLinks || []);
        }
        this.isLoadingOrganization = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingOrganization = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadCountries(): void {
    this.isLoadingCountries = true;
    this.utilityService.getCountries().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          const countryList = response.data as any[];
          this.countries = countryList
            .map((c) => ({
              name: c.countryName,
              cca2: c.isoAlpha2Code,
              currency: c.code || 'N/A'
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        this.isLoadingCountries = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingCountries = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadOrganizationMetadata(): void {
    this.isLoadingOrganizationTypes = true;
    this.organizationService.getOrganizationMetadata().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          const data = (response as any).data as OrganizationMetaDataResponse;
          this.organizationTypesMetadata = data?.organizationTypes || [];
        }
        this.isLoadingOrganizationTypes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingOrganizationTypes = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadNetworkKeysCount(): void {
    this.isLoadingNetworkKeys = true;
    this.networkKeyService.getActiveKeys().subscribe({
      next: (res) => {
        this.isLoadingNetworkKeys = false;
        this.networkKeysCount = res.success && res.data ? res.data.length : 0;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingNetworkKeys = false;
        this.networkKeysCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  private loadInvitationsCount(): void {
    this.isLoadingInvitations = true;
    this.invitationService.getInvitations().subscribe({
      next: (res) => {
        this.isLoadingInvitations = false;
        this.invitationsCount = res.success && res.data ? res.data.length : 0;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingInvitations = false;
        this.invitationsCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  private loadStoredLogo(): void {
    try {
      const stored = this.localStorage.getItem('organization_logo_preview');
      if (stored) {
        this.customLogoUrl = stored;
      }
    } catch {
      // Ignore storage errors
    }
  }

  getInitials(): string {
    const name = this.currentOrganization?.names?.displayName || '';
    if (!name) return 'MO';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  getOrganizationTypeName(): string {
    const typeId = this.currentOrganization?.organizationType?.typeId;
    if (!typeId) return this.currentOrganization?.organizationType?.name || 'Not specified';
    const type = this.organizationTypesMetadata.find((t) => t.id === typeId);
    return type?.name || this.currentOrganization?.organizationType?.name || 'Business Organization';
  }

  getCountryDisplay(): string {
    const code = this.currentOrganization?.address?.country;
    if (!code) return '—';
    const found = this.countries.find(
      (c) => c.cca2?.toLowerCase() === code.toLowerCase()
    );
    return found ? `${found.name} (${found.cca2})` : code;
  }

  getFinancialYearEndDisplay(): string {
    const yearEndMonth = this.currentOrganization?.financialYear?.yearEndMonth;
    const yearEndDay = this.currentOrganization?.financialYear?.yearEndDay;

    if (!yearEndMonth || !yearEndDay) {
      return '—';
    }

    const monthIndex = parseInt(yearEndMonth, 10) - 1;
    const monthAbbr = this.monthAbbreviations[monthIndex] || `Month ${yearEndMonth}`;
    return `${monthAbbr}. ${yearEndDay}`;
  }

  getSafeUrl(url?: string): string {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  private mapExternalLinks(rawLinks: CurrentOrganizationResponseExternalLink[]): ProfileSocialLink[] {
    const byPlatform = new Map<'FACEBOOK' | 'X' | 'INSTAGRAM' | 'LINKEDIN', string>();
    for (const item of rawLinks || []) {
      const upper = (item?.linkType || '').trim().toUpperCase();
      const url = (item?.url || '').trim();
      if (!url) continue;
      if (upper === 'FACEBOOK') byPlatform.set('FACEBOOK', this.getSafeUrl(url));
      else if (upper === 'X' || upper === 'TWITTER') byPlatform.set('X', this.getSafeUrl(url));
      else if (upper === 'INSTAGRAM') byPlatform.set('INSTAGRAM', this.getSafeUrl(url));
      else if (upper === 'LINKEDIN') byPlatform.set('LINKEDIN', this.getSafeUrl(url));
    }

    return this.supportedPlatforms
      .filter((p) => byPlatform.has(p.type))
      .map((p) => ({
        platform: p.type,
        label: p.label,
        url: byPlatform.get(p.type)!
      }));
  }

  copyOrganizationId(): void {
    const id = this.currentOrganization?.organizationId;
    if (!id) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        this.copiedId = true;
        setTimeout(() => (this.copiedId = false), 2000);
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: 'Organization ID copied to clipboard',
          life: 2000
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
          detail: 'Logo image must be smaller than 2MB'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.customLogoUrl = result;
        try {
          this.localStorage.setItem('organization_logo_preview', result);
        } catch {
          // Ignore
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Logo Updated',
          detail: 'Organization logo updated',
          life: 2500
        });
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.customLogoUrl = null;
    try {
      this.localStorage.removeItem('organization_logo_preview');
    } catch {
      // Ignore
    }
    this.messageService.add({
      severity: 'info',
      summary: 'Logo Removed',
      detail: 'Reverted to default monogram avatar',
      life: 2000
    });
    this.cdr.markForCheck();
  }

  getAddressTypeIcon(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('BILLING')) return 'pi-receipt';
    if (t.includes('SHIPPING') || t.includes('DELIVERY')) return 'pi-truck';
    if (t.includes('POBOX') || t.includes('POST')) return 'pi-inbox';
    if (t.includes('STREET') || t.includes('PHYSICAL')) return 'pi-building';
    return 'pi-map-marker';
  }

  getAddressCountryName(countryCode: string): string {
    if (!countryCode) return '';
    const found = this.countries.find(
      (c) => c.cca2?.toLowerCase() === countryCode.toLowerCase()
    );
    return found ? found.name : countryCode;
  }

  navigateToSettings(category?: string): void {
    if (category) {
      this.router.navigate(['/main/organization/settings'], { queryParams: { category } });
    } else {
      this.router.navigate(['/main/organization/settings']);
    }
  }

  onCreateAnotherOrganization(): void {
    const email =
      this.localStorage.getItem('user_email') ||
      this.currentOrganization?.address?.email ||
      '';
    if (email) {
      this.router.navigate(['/create/organization', email]);
    } else {
      this.router.navigate(['/select-organization']);
    }
  }

  onSwitchOrganization(): void {
    this.router.navigate(['/select-organization']);
  }
}
