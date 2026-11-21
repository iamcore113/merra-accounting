import { Component, OnDestroy, OnInit, ViewEncapsulation, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { OrganizationService } from '../../../../shared/services/organization-service';
import { NetworkKeyService } from '../../../../shared/services/network-key-service';
import { InvitationService } from '../../../../shared/services/invitation-service';
import { UtilityService } from '../../../../shared/services/utility-service';
import { LocalStorageService } from '../../../../shared/services/local-storage-service';
import { InvitationAccountSetupModal } from '../../../../shared/components/invitation-account-setup-modal/invitation-account-setup-modal';
import {
  CurrentOrganizationResponse,
  OrganizationMetaDataResponse,
  OrganizationTypesMetaData,
  CurrentOrganizationResponseContactAddress,
  CurrentOrganizationResponseExternalLink,
  OrganizationMemberResponse
} from '../../../../shared/models/organization';
import { InvitationResponse, ORGANIZATION_INVITATION_ROLES } from '../../../../shared/models/invitation';
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
    FormsModule,
    RouterModule,
    ButtonModule,
    TooltipModule,
    TagModule,
    SkeletonModule,
    DialogModule,
    DatePipe,
    InvitationAccountSetupModal
  ],
  templateUrl: './organization-profile.html',
  styleUrl: './organization-profile.scss',
  encapsulation: ViewEncapsulation.None
})
export class OrganizationProfile implements OnInit, OnDestroy {
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
  isLoadingMembers = false;

  networkKeysCount = 0;
  invitationsCount = 0;
  organizationMembers: OrganizationMemberResponse[] = [];
  memberAvatarUrls: Record<string, string> = {};
  pendingInvitationsList: InvitationResponse[] = [];
  memberFilter: 'ALL' | 'ACTIVE' | 'PENDING' = 'ALL';
  copiedId = false;
  customLogoUrl: string | null = null;
  isUploadingLogo = false;
  isRemovingLogo = false;
  isLoadingLogo = false;
  isLogoLoaded = false;
  isDraggingLogo = false;
  private previousLogoUrl: string | null = null;

  // Interactive Organization Logo Editor (Move/Pan, Zoom/Crop, Rotate, Flip)
  showLogoEditorDialog = false;
  editorLogoUrl: string | null = null;
  editorFileName = 'organization-logo.png';
  editorFileType = 'image/png';
  editorZoom = 1;
  editorRotation = 0;
  editorFlipX = false;
  editorFlipY = false;
  editorPanX = 0;
  editorPanY = 0;
  isDraggingEditorCanvas = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragInitialPanX = 0;
  private dragInitialPanY = 0;
  private editorNaturalWidth = 0;
  private editorNaturalHeight = 0;

  addresses: CurrentOrganizationResponseContactAddress[] = [];
  externalLinks: ProfileSocialLink[] = [];

  requiresInvitationAccountSetup = signal(false);
  pendingInvitationToken = '';
  pendingInvitationEmail = '';
  pendingInvitationOrgName = '';
  pendingInvitationLegalName = '';
  pendingInvitationRole = '';

  private readonly supportedPlatforms: { type: 'FACEBOOK' | 'X' | 'INSTAGRAM' | 'LINKEDIN'; label: string }[] = [
    { type: 'FACEBOOK', label: 'Facebook' },
    { type: 'X', label: 'X (Twitter)' },
    { type: 'INSTAGRAM', label: 'Instagram' },
    { type: 'LINKEDIN', label: 'LinkedIn' }
  ];

  private monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  ngOnInit(): void {
    const accessToken = this.localStorage.getItem('access_token');
    const pendingToken = this.localStorage.getItem('pending_invitation_token');

    if (!accessToken && pendingToken) {
      this.pendingInvitationToken = pendingToken;
      this.pendingInvitationEmail = this.localStorage.getItem('pending_invitation_email') || '';
      this.pendingInvitationOrgName = this.localStorage.getItem('pending_invitation_org_name') || 'Invited Organization';
      this.pendingInvitationLegalName =
        this.localStorage.getItem('pending_invitation_legal_name') || this.pendingInvitationOrgName;
      this.pendingInvitationRole = this.localStorage.getItem('pending_invitation_role') || 'MEMBER';

      this.currentOrganization = {
        organizationId: this.localStorage.getItem('pending_invitation_org_id') || '',
        names: {
          displayName: this.pendingInvitationOrgName,
          legalName: this.pendingInvitationLegalName,
          description: '',
        },
      } as CurrentOrganizationResponse;

      this.requiresInvitationAccountSetup.set(true);
      this.loadCountries();
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingOrganization = true;
    this.loadCountries();
    this.loadOrganizationMetadata();
    this.loadOrganization();
    this.loadNetworkKeysCount();
    this.loadInvitationsCount();
    this.loadOrganizationMembers();
    this.loadStoredLogo();
  }

  onInvitationAccountCreated(): void {
    this.requiresInvitationAccountSetup.set(false);
    this.isLoadingOrganization = true;
    this.loadOrganizationMetadata();
    this.loadOrganization();
    this.loadNetworkKeysCount();
    this.loadInvitationsCount();
    this.loadOrganizationMembers();
    this.loadStoredLogo();
    this.cdr.markForCheck();
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
        this.pendingInvitationsList = res.success && res.data ? res.data : [];
        this.invitationsCount = this.pendingInvitationsList.length;
        this.mergePendingInvitationsIntoMembers();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingInvitations = false;
        this.pendingInvitationsList = [];
        this.invitationsCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  loadOrganizationMembers(): void {
    if (!this.organizationService.getOrganizationMembers) {
      return;
    }
    this.isLoadingMembers = true;
    this.organizationService.getOrganizationMembers().subscribe({
      next: (res: Config) => {
        this.isLoadingMembers = false;
        if (res.success && 'data' in res && Array.isArray(res.data)) {
          this.organizationMembers = res.data as OrganizationMemberResponse[];
        } else {
          this.organizationMembers = [];
        }
        this.mergePendingInvitationsIntoMembers();
        this.loadMemberAvatars();
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingMembers = false;
        this.mergePendingInvitationsIntoMembers();
        this.cdr.markForCheck();
      }
    });
  }

  private loadMemberAvatars(): void {
    if (!this.organizationService.getOrganizationMemberProfileImage) {
      return;
    }
    for (const member of this.organizationMembers) {
      const userId = member.userId;
      if (!userId || member.status === 'PENDING' || !member.hasProfileImage) {
        continue;
      }
      if (this.memberAvatarUrls[userId]) {
        continue;
      }
      this.organizationService.getOrganizationMemberProfileImage(userId).subscribe({
        next: (blob: Blob) => {
          if (blob && blob.size > 0) {
            this.memberAvatarUrls[userId] = URL.createObjectURL(blob);
            this.cdr.markForCheck();
          }
        },
        error: () => {
          delete this.memberAvatarUrls[userId];
        }
      });
    }
  }

  onMemberAvatarError(userId?: string | null): void {
    if (!userId) return;
    const existing = this.memberAvatarUrls[userId];
    if (existing?.startsWith('blob:')) {
      URL.revokeObjectURL(existing);
    }
    delete this.memberAvatarUrls[userId];
    this.cdr.markForCheck();
  }

  private revokeMemberAvatarUrls(): void {
    for (const url of Object.values(this.memberAvatarUrls)) {
      if (url?.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }
    this.memberAvatarUrls = {};
  }

  private mergePendingInvitationsIntoMembers(): void {
    const byEmail = new Map<string, OrganizationMemberResponse>();
    for (const member of this.organizationMembers) {
      const key = (member.email || member.id || '').trim().toLowerCase();
      if (key) {
        byEmail.set(key, { ...member });
      }
    }

    for (const inv of this.pendingInvitationsList) {
      const emailKey = (inv.inviteeEmail || '').trim().toLowerCase();
      if (!emailKey) continue;
      const existing = byEmail.get(emailKey);
      if (!existing) {
        byEmail.set(emailKey, {
          id: inv.id,
          userId: null,
          fullName: null,
          email: inv.inviteeEmail,
          role: inv.role || 'MEMBER',
          status: 'PENDING',
          isCreator: false,
          isInvited: true,
          invitedBy: null,
          invitationDate: inv.createdAt || null,
          dateJoined: null,
          expiresAt: inv.expiresAt || null
        });
      } else if (existing.status === 'PENDING' && inv.expiresAt && !existing.expiresAt) {
        existing.expiresAt = inv.expiresAt;
      }
    }

    this.organizationMembers = Array.from(byEmail.values());
  }

  get filteredMembers(): OrganizationMemberResponse[] {
    if (this.memberFilter === 'ACTIVE') {
      return this.organizationMembers.filter((m) => m.status !== 'PENDING');
    }
    if (this.memberFilter === 'PENDING') {
      return this.organizationMembers.filter((m) => m.status === 'PENDING');
    }
    return this.organizationMembers;
  }

  get activeMembersCount(): number {
    return this.organizationMembers.filter((m) => m.status !== 'PENDING').length;
  }

  get pendingMembersCount(): number {
    return this.organizationMembers.filter((m) => m.status === 'PENDING').length;
  }

  setMemberFilter(filter: 'ALL' | 'ACTIVE' | 'PENDING'): void {
    this.memberFilter = filter;
  }

  getMemberDisplayName(member: OrganizationMemberResponse): string {
    if (member.fullName && member.fullName.trim()) {
      return member.fullName.trim();
    }
    if (member.status === 'PENDING') {
      return member.email || 'Pending Invitee';
    }
    if (member.email) {
      const localPart = member.email.split('@')[0];
      return localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
    }
    return 'Organization Member';
  }

  getMemberInitials(member: OrganizationMemberResponse): string {
    const source = (member.fullName && member.fullName.trim()) || member.email || 'OM';
    const clean = source.includes('@') ? source.split('@')[0] : source;
    const parts = clean.trim().split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 0) return 'OM';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getRoleDisplayLabel(role?: string, isCreator?: boolean): string {
    const normalized = (role || '').trim().toUpperCase().replace(/^ROLE_/, '');
    if (normalized === 'CREATOR' || isCreator) {
      return 'Creator (Owner)';
    }
    const found = ORGANIZATION_INVITATION_ROLES.find((r) => r.value === normalized);
    if (found) {
      return found.label;
    }
    if (!normalized) return 'Member';
    return normalized
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }

  getRoleBadgeClass(role?: string, isCreator?: boolean): string {
    const normalized = (role || '').trim().toUpperCase().replace(/^ROLE_/, '');
    if (normalized === 'CREATOR' || isCreator) return 'role-creator';
    if (normalized === 'ADVISOR') return 'role-advisor';
    if (normalized === 'STANDARD') return 'role-standard';
    if (normalized === 'INVOICE_ONLY') return 'role-invoice';
    if (normalized === 'READ_ONLY') return 'role-readonly';
    return 'role-member';
  }

  private loadStoredLogo(): void {
    if (!this.organizationService.getProfileImage) {
      return;
    }
    this.isLoadingLogo = true;
    this.organizationService.getProfileImage().subscribe({
      next: (blob: Blob) => {
        this.setLogoFromBlob(blob);
        this.isLoadingLogo = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // 404 means no profile image has been uploaded yet
        this.customLogoUrl = null;
        this.isLoadingLogo = false;
        this.cdr.markForCheck();
      }
    });
  }

  private setLogoFromBlob(blob: Blob): void {
    this.revokeLogoUrl();
    this.isLogoLoaded = false;
    this.customLogoUrl = URL.createObjectURL(blob);
    this.cdr.markForCheck();
  }

  private revokeLogoUrl(): void {
    if (this.customLogoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.customLogoUrl);
    }
  }

  ngOnDestroy(): void {
    this.revokeLogoUrl();
    this.revokeEditorLogoUrl();
    this.revokeMemberAvatarUrls();
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
    const file = input.files?.[0];
    input.value = '';
    if (file) this.openLogoEditorWithFile(file);
  }

  openLogoPicker(input: HTMLInputElement): void {
    if (this.isUploadingLogo || this.isRemovingLogo || this.isLoadingLogo) return;
    input.click();
  }

  onLogoDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isUploadingLogo) this.isDraggingLogo = true;
  }

  onLogoDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingLogo = false;
  }

  onLogoDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingLogo = false;
    const file = event.dataTransfer?.files?.[0];
    if (file && !this.isUploadingLogo) this.openLogoEditorWithFile(file);
  }

  private validateLogoFile(file: File): boolean {
    const allowed = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Unsupported File',
        detail: 'Logo must be a PNG, JPEG or WEBP image'
      });
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'warn',
        summary: 'File Too Large',
        detail: `Logo image must be smaller than 5MB (selected: ${(file.size / 1024 / 1024).toFixed(1)}MB)`
      });
      return false;
    }
    return true;
  }

  openLogoEditorWithFile(file: File): void {
    if (!this.validateLogoFile(file)) {
      return;
    }
    this.revokeEditorLogoUrl();
    this.editorFileName = file.name || 'organization-logo.png';
    this.editorFileType = file.type || 'image/png';
    this.editorLogoUrl = URL.createObjectURL(file);
    this.resetLogoEditorTransforms();
    this.showLogoEditorDialog = true;
    this.cdr.markForCheck();
  }

  openExistingLogoEditor(): void {
    if (!this.customLogoUrl || this.isUploadingLogo || this.isRemovingLogo) {
      return;
    }
    this.revokeEditorLogoUrl();
    this.editorFileName = 'organization-logo.png';
    this.editorFileType = 'image/png';
    this.editorLogoUrl = this.customLogoUrl;
    this.resetLogoEditorTransforms();
    this.showLogoEditorDialog = true;
    this.cdr.markForCheck();
  }

  closeLogoEditorDialog(): void {
    this.showLogoEditorDialog = false;
    this.isDraggingEditorCanvas = false;
    this.revokeEditorLogoUrl();
    this.cdr.markForCheck();
  }

  private revokeEditorLogoUrl(): void {
    if (
      this.editorLogoUrl &&
      this.editorLogoUrl.startsWith('blob:') &&
      this.editorLogoUrl !== this.customLogoUrl
    ) {
      URL.revokeObjectURL(this.editorLogoUrl);
    }
    this.editorLogoUrl = null;
  }

  resetLogoEditorTransforms(): void {
    this.editorZoom = 1;
    this.editorRotation = 0;
    this.editorFlipX = false;
    this.editorFlipY = false;
    this.editorPanX = 0;
    this.editorPanY = 0;
  }

  onEditorLogoLoaded(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.editorNaturalWidth = img.naturalWidth || 512;
    this.editorNaturalHeight = img.naturalHeight || 512;
  }

  getEditorTransformStyle(): string {
    const scaleX = (this.editorFlipX ? -1 : 1) * this.editorZoom;
    const scaleY = (this.editorFlipY ? -1 : 1) * this.editorZoom;
    return `translate3d(${this.editorPanX}px, ${this.editorPanY}px, 0) rotate(${this.editorRotation}deg) scale(${scaleX}, ${scaleY})`;
  }

  onEditorPointerDown(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isDraggingEditorCanvas = true;
    const pt = this.getPointerCoordinates(event);
    this.dragStartX = pt.x;
    this.dragStartY = pt.y;
    this.dragInitialPanX = this.editorPanX;
    this.dragInitialPanY = this.editorPanY;
  }

  onEditorPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDraggingEditorCanvas) {
      return;
    }
    event.preventDefault();
    const pt = this.getPointerCoordinates(event);
    this.editorPanX = Math.round(this.dragInitialPanX + (pt.x - this.dragStartX));
    this.editorPanY = Math.round(this.dragInitialPanY + (pt.y - this.dragStartY));
  }

  onEditorPointerUp(): void {
    this.isDraggingEditorCanvas = false;
  }

  onEditorWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.08 : -0.08;
    this.adjustEditorZoom(delta);
  }

  private getPointerCoordinates(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('touches' in event && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    const mouse = event as MouseEvent;
    return { x: mouse.clientX, y: mouse.clientY };
  }

  adjustEditorZoom(delta: number): void {
    const next = Math.min(3, Math.max(0.5, +(this.editorZoom + delta).toFixed(2)));
    this.editorZoom = next;
  }

  rotateEditorLogo(degreesDelta: number): void {
    let next = this.editorRotation + degreesDelta;
    while (next > 180) next -= 360;
    while (next < -180) next += 360;
    this.editorRotation = next;
  }

  toggleEditorFlipX(): void {
    this.editorFlipX = !this.editorFlipX;
  }

  toggleEditorFlipY(): void {
    this.editorFlipY = !this.editorFlipY;
  }

  nudgeEditorPosition(dx: number, dy: number): void {
    this.editorPanX += dx;
    this.editorPanY += dy;
  }

  centerEditorPosition(): void {
    this.editorPanX = 0;
    this.editorPanY = 0;
  }

  async applyCropAndUploadLogo(): Promise<void> {
    if (!this.editorLogoUrl) {
      return;
    }
    try {
      const croppedFile = await this.renderEditedLogoToFile();
      this.closeLogoEditorDialog();
      this.uploadLogo(croppedFile);
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: 'Image Processing Failed',
        detail: 'Could not process the edited logo image. Please try again.'
      });
    }
  }

  private renderEditedLogoToFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!this.editorLogoUrl) {
        reject(new Error('No editor logo source'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const outputSize = 512;
        const viewportSize = 260;
        const ratio = outputSize / viewportSize;

        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        const natW = img.naturalWidth || outputSize;
        const natH = img.naturalHeight || outputSize;
        const baseScale = Math.max(outputSize / natW, outputSize / natH);
        const drawW = natW * baseScale;
        const drawH = natH * baseScale;

        ctx.save();
        ctx.translate(
          outputSize / 2 + this.editorPanX * ratio,
          outputSize / 2 + this.editorPanY * ratio
        );
        ctx.rotate((this.editorRotation * Math.PI) / 180);
        ctx.scale(
          (this.editorFlipX ? -1 : 1) * this.editorZoom,
          (this.editorFlipY ? -1 : 1) * this.editorZoom
        );
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const mimeType = ['image/png', 'image/jpeg', 'image/webp'].includes(this.editorFileType)
          ? this.editorFileType
          : 'image/png';

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create logo blob'));
              return;
            }
            const file = new File([blob], this.editorFileName || 'organization-logo.png', {
              type: mimeType
            });
            resolve(file);
          },
          mimeType,
          0.92
        );
      };
      img.onerror = () => reject(new Error('Failed to load logo image for cropping'));
      img.src = this.editorLogoUrl;
    });
  }

  uploadLogo(file: File): void {
    if (!this.validateLogoFile(file)) {
      return;
    }

    // Optimistic preview: show the chosen image immediately (dimmed with a spinner)
    this.previousLogoUrl = this.customLogoUrl;
    this.customLogoUrl = URL.createObjectURL(file);
    this.isLogoLoaded = true;
    this.isUploadingLogo = true;
    this.cdr.markForCheck();

    this.organizationService.uploadProfileImage(file).subscribe({
      next: () => {
        if (this.previousLogoUrl?.startsWith('blob:')) URL.revokeObjectURL(this.previousLogoUrl);
        this.previousLogoUrl = null;
        this.isUploadingLogo = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Logo Updated',
          detail: 'Organization logo updated',
          life: 2500
        });
        this.cdr.markForCheck();
      },
      error: () => {
        // Revert to the previous logo
        this.revokeLogoUrl();
        this.customLogoUrl = this.previousLogoUrl;
        this.previousLogoUrl = null;
        this.isUploadingLogo = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Upload Failed',
          detail: 'Could not upload the organization logo. Please try again.'
        });
        this.cdr.markForCheck();
      }
    });
  }

  onLogoImageLoaded(): void {
    this.isLogoLoaded = true;
    this.cdr.markForCheck();
  }

  removeLogo(): void {
    if (this.isRemovingLogo || this.isUploadingLogo) return;
    this.isRemovingLogo = true;
    this.organizationService.deleteProfileImage().subscribe({
      next: () => {
        this.isRemovingLogo = false;
        this.revokeLogoUrl();
        this.customLogoUrl = null;
        this.messageService.add({
          severity: 'info',
          summary: 'Logo Removed',
          detail: 'Reverted to default monogram avatar',
          life: 2000
        });
        this.cdr.markForCheck();
      },
      error: () => {
        this.isRemovingLogo = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Remove Failed',
          detail: 'Could not remove the organization logo'
        });
        this.cdr.markForCheck();
      }
    });
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
