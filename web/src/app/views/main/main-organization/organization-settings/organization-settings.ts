import { Component, OnInit, ViewEncapsulation, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

import { Dialog, DialogData } from '../../../../shared/components/dialog/dialog';
import { OrganizationService } from '../../../../shared/services/organization-service';
import { NetworkKeyService } from '../../../../shared/services/network-key-service';
import { InvitationService } from '../../../../shared/services/invitation-service';
import { UtilityService } from '../../../../shared/services/utility-service';
import { LocalStorageService } from '../../../../shared/services/local-storage-service';
import {
  CurrentOrganizationResponse,
  OrganizationMetaDataResponse,
  OrganizationTypesMetaData,
  CurrentOrganizationResponseNames,
  CurrentOrganizationResponseType,
  CurrentOrganizationResponseContact,
  CurrentOrganizationResponseFinancialYear,
  CurrentOrganizationResponseContactAddress,
  CurrentOrganizationResponseExternalLink
} from '../../../../shared/models/organization';
import { NetworkKeyResponse } from '../../../../shared/models/network-key';
import { InvitationResponse, ORGANIZATION_INVITATION_ROLES } from '../../../../shared/models/invitation';
import { Config } from '../../../../shared/models/api_response';

export type SettingsCategory = 'details' | 'finances' | 'connected-sites' | 'network-keys';
export type ExternalPlatformType = 'FACEBOOK' | 'X' | 'INSTAGRAM' | 'LINKEDIN';

export interface ExternalLinkItem {
  id: string;
  platform: ExternalPlatformType;
  url: string;
  label?: string;
}

export interface SocialPlatformOption {
  label: string;
  value: ExternalPlatformType;
  placeholder: string;
  handleHint: string;
}

@Component({
  selector: 'app-organization-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToggleSwitchModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
    DialogModule,
    TagModule,
    SkeletonModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './organization-settings.html',
  styleUrl: './organization-settings.scss',
  encapsulation: ViewEncapsulation.None
})
export class OrganizationSettings implements OnInit {
  public organizationService = inject(OrganizationService);
  private readonly networkKeyService = inject(NetworkKeyService);
  private readonly invitationService = inject(InvitationService);
  private readonly utilityService = inject(UtilityService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  // Active Category State
  activeCategory = signal<SettingsCategory>('details');

  currentOrganization: CurrentOrganizationResponse | undefined;
  public organizationTypesMetadata: OrganizationTypesMetaData[] = [];
  public availableAddressTypes: { id: string; name: string }[] = [];
  public isLoadingOrganizationTypes = false;
  public isLoadingOrganization = false;
  public countries: any[] = [];
  public isLoadingCountries = false;

  // Addresses
  addresses: CurrentOrganizationResponseContactAddress[] = [];
  showAddressDialog = false;
  editingAddressIndex: number | null = null;
  isSavingAddress = signal(false);
  showDeleteAddressDialog = false;
  addressIndexToDelete: number | null = null;
  isDeletingAddress = signal(false);

  addressForm: FormGroup = this.fb.group({
    type: ['STREET', Validators.required],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    postalCode: ['', Validators.required],
    country: ['', Validators.required]
  });

  // Organization Form
  organizationForm: FormGroup = this.fb.group({
    organizationId: [{ value: '', disabled: true }],
    organizationType: this.fb.group({
      typeId: ['', Validators.required],
      name: ['', Validators.required]
    }),
    names: this.fb.group({
      displayName: ['', Validators.required],
      legalName: ['', Validators.required],
      description: ['']
    }),
    address: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      currency: ['', Validators.required],
      timeZone: ['', Validators.required]
    }),
    website: [''],
    createdDate: [{ value: '', disabled: true }],
    status: [{ value: '', disabled: true }],
    financialYear: this.fb.group({
      yearEndDay: ['', [Validators.required, Validators.min(1), Validators.max(31)]],
      yearEndMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]]
    })
  });

  // Updating signals
  isUpdatingNames = signal(false);
  isUpdatingDescription = signal(false);
  isUpdatingOrganizationType = signal(false);
  isUpdatingContact = signal(false);
  isUpdatingWebsite = signal(false);
  isUpdatingRegional = signal(false);
  isUpdatingFinancialYear = signal(false);
  isUpdatingPaymentTerms = signal(false);
  isUpdatingExternalLinks = signal(false);

  // Original snapshot for change detection
  private originalNames: { displayName: string; legalName: string } | null = null;
  private originalDescription: string | null = null;
  private originalOrganizationTypeId: string | null = null;
  private originalEmail: string | null = null;
  private originalWebsite: string | null = null;
  private originalCountry: string | null = null;
  private originalTimeZone: string | null = null;
  private originalFinancialYear: { yearEndDay: string; yearEndMonth: string } | null = null;

  isOrganizationActive = true;

  // Payment Terms state
  paymentTermPresets = [
    { label: 'Due on Receipt', value: 'DUE_ON_RECEIPT', days: 0, type: 'DAYSAFTERBILLDATE' },
    { label: 'Net 15 (15 days after invoice)', value: 'NET_15', days: 15, type: 'DAYSAFTERBILLDATE' },
    { label: 'Net 30 (30 days after invoice)', value: 'NET_30', days: 30, type: 'DAYSAFTERBILLDATE' },
    { label: 'Net 60 (60 days after invoice)', value: 'NET_60', days: 60, type: 'DAYSAFTERBILLDATE' },
    { label: 'End of Current Month', value: 'CURRENT_MONTH', days: 0, type: 'OFCURRENTMONTH' },
    { label: 'End of Following Month', value: 'FOLLOWING_MONTH', days: 0, type: 'OFFOLLOWINGMONTH' },
    { label: 'Custom Days', value: 'CUSTOM', days: 30, type: 'DAYSAFTERBILLDATE' }
  ];
  selectedPaymentTermPreset = 'NET_30';
  paymentTermDays = 30;
  paymentTermType = 'DAYSAFTERBILLDATE';
  paymentInstructions = 'Payment is due within agreed terms. Thank you for your business.';
  private originalPaymentTermPreset = 'NET_30';
  private originalPaymentTermDays = 30;
  private originalPaymentInstructions = 'Payment is due within agreed terms. Thank you for your business.';

  // External Links state (strictly Facebook, X (Twitter), Instagram, and LinkedIn)
  readonly externalLinkPlatforms: SocialPlatformOption[] = [
    {
      label: 'Facebook',
      value: 'FACEBOOK',
      placeholder: 'https://www.facebook.com/your-organization',
      handleHint: 'Official Facebook Page URL'
    },
    {
      label: 'X (Twitter)',
      value: 'X',
      placeholder: 'https://x.com/your-organization',
      handleHint: 'Official X (Twitter) profile URL'
    },
    {
      label: 'Instagram',
      value: 'INSTAGRAM',
      placeholder: 'https://www.instagram.com/your-organization',
      handleHint: 'Official Instagram profile URL'
    },
    {
      label: 'LinkedIn',
      value: 'LINKEDIN',
      placeholder: 'https://www.linkedin.com/company/your-organization',
      handleHint: 'Official LinkedIn Company Page URL'
    }
  ];

  socialLinksForm: Record<ExternalPlatformType, string> = {
    FACEBOOK: '',
    X: '',
    INSTAGRAM: '',
    LINKEDIN: ''
  };

  private originalSocialLinksForm: Record<ExternalPlatformType, string> = {
    FACEBOOK: '',
    X: '',
    INSTAGRAM: '',
    LINKEDIN: ''
  };

  externalLinks: ExternalLinkItem[] = [];
  newLinkPlatform: ExternalPlatformType = 'LINKEDIN';
  newLinkUrl = '';

  // Network keys state
  networkKeys: NetworkKeyResponse[] = [];
  isLoadingNetworkKeys = false;
  isGeneratingNetworkKey = false;
  isDeletingNetworkKey = false;
  visibleNetworkKeys: Record<string, boolean> = {};
  showCreateNetworkKeyDialog = false;
  newNetworkKeyName = 'Primary Network Key';
  showDeleteNetworkKeyDialog = false;
  selectedNetworkKeyToDelete: NetworkKeyResponse | null = null;

  // Invitations state
  invitations: InvitationResponse[] = [];
  isLoadingInvitations = false;
  isCreatingInvitation = false;
  inviteeEmail = '';
  selectedInvitationRole = 'STANDARD';
  readonly invitationRoles = ORGANIZATION_INVITATION_ROLES;
  lastCreatedInvitation: InvitationResponse | null = null;
  invitationNotice: {
    title: string;
    message: string;
    isAlreadyMember: boolean;
    suggestedEmail?: string;
  } | null = null;

  private readonly knownEmailDomains = [
    'gmail.com',
    'googlemail.com',
    'yahoo.com',
    'yahoo.co.uk',
    'ymail.com',
    'outlook.com',
    'hotmail.com',
    'live.com',
    'msn.com',
    'icloud.com',
    'aol.com',
    'protonmail.com',
    'proton.me',
    'zoho.com',
    'gmx.com',
    'mail.com'
  ];

  private monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  ngOnInit(): void {
    // Check query params for active category
    const cat = (this.route.snapshot.queryParams['category'] || this.route.snapshot.queryParams['tab']) as SettingsCategory;
    if (cat && ['details', 'finances', 'connected-sites', 'network-keys'].includes(cat)) {
      this.activeCategory.set(cat);
    }

    this.route.queryParams.subscribe((params) => {
      const qCat = (params['category'] || params['tab']) as SettingsCategory;
      if (qCat && ['details', 'finances', 'connected-sites', 'network-keys'].includes(qCat)) {
        this.activeCategory.set(qCat);
      }
    });

    this.isLoadingOrganization = true;
    this.loadCountries();
    this.loadOrganizationTypesMetadata();
    this.loadOrganization();
    this.loadNetworkKeys();
    this.loadInvitations();
  }

  selectCategory(cat: SettingsCategory): void {
    this.activeCategory.set(cat);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: cat },
      queryParamsHandling: 'merge'
    });
  }

  loadOrganization(): void {
    this.isLoadingOrganization = true;
    this.organizationService.getCurrentOrganization().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalNames = {
            displayName: this.currentOrganization.names.displayName,
            legalName: this.currentOrganization.names.legalName
          };
          this.originalDescription = this.currentOrganization.names.description;
          this.originalOrganizationTypeId = this.currentOrganization.organizationType.typeId;
          this.originalEmail = this.currentOrganization.address.email;
          this.originalWebsite = this.currentOrganization.website || '';
          this.originalCountry = this.currentOrganization.address.country;
          this.originalTimeZone = this.currentOrganization.address.timeZone;
          this.originalFinancialYear = {
            yearEndDay: String(this.currentOrganization.financialYear?.yearEndDay || ''),
            yearEndMonth: String(this.currentOrganization.financialYear?.yearEndMonth || '')
          };

          this.addresses = [...(this.currentOrganization.address?.addresses || [])];
          this.syncExternalLinksFromResponse(this.currentOrganization.externalLinks || []);
          this.isOrganizationActive = this.currentOrganization.status === 'ACTIVE_ACCOUNT';

          this.organizationForm.patchValue({
            organizationId: this.currentOrganization.organizationId,
            organizationType: {
              typeId: this.currentOrganization.organizationType.typeId,
              name: this.currentOrganization.organizationType.name
            },
            names: {
              displayName: this.currentOrganization.names.displayName,
              legalName: this.currentOrganization.names.legalName,
              description: this.currentOrganization.names.description
            },
            address: {
              email: this.currentOrganization.address.email,
              country: this.currentOrganization.address.country,
              currency: this.currentOrganization.address.currency,
              timeZone: this.currentOrganization.address.timeZone
            },
            website: this.currentOrganization.website,
            createdDate: this.currentOrganization.createdDate,
            status: this.currentOrganization.status,
            financialYear: {
              yearEndDay: this.currentOrganization.financialYear?.yearEndDay,
              yearEndMonth: this.currentOrganization.financialYear?.yearEndMonth
            }
          });
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

  private loadOrganizationTypesMetadata(): void {
    this.isLoadingOrganizationTypes = true;
    this.organizationService.getOrganizationMetadata().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          const verifiedData = (response as any).data as OrganizationMetaDataResponse;
          this.organizationTypesMetadata = verifiedData?.organizationTypes || [];
          if (verifiedData?.organizationAddressTypes?.length) {
            this.availableAddressTypes = verifiedData.organizationAddressTypes.map((t) => ({
              id: t.id,
              name: t.name
            }));
          } else {
            this.availableAddressTypes = [
              { id: 'STREET', name: 'Street Address' },
              { id: 'POBOX', name: 'Post Office Box' },
              { id: 'BILLING', name: 'Billing Address' },
              { id: 'SHIPPING', name: 'Shipping Address' }
            ];
          }
        }
        this.isLoadingOrganizationTypes = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.availableAddressTypes = [
          { id: 'STREET', name: 'Street Address' },
          { id: 'POBOX', name: 'Post Office Box' },
          { id: 'BILLING', name: 'Billing Address' },
          { id: 'SHIPPING', name: 'Shipping Address' }
        ];
        this.isLoadingOrganizationTypes = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Change Detection Helpers
  hasNamesChanged(): boolean {
    const names = this.organizationForm.get('names')?.value;
    if (!this.originalNames || !names) return false;
    return (
      names.displayName !== this.originalNames.displayName ||
      names.legalName !== this.originalNames.legalName
    );
  }

  hasDescriptionChanged(): boolean {
    const description = this.organizationForm.get('names.description')?.value ?? '';
    const original = this.originalDescription ?? '';
    return description !== original;
  }

  hasOrganizationTypeChanged(): boolean {
    const typeId = this.organizationForm.get('organizationType.typeId')?.value;
    if (this.originalOrganizationTypeId === null || typeId === undefined) return false;
    return typeId !== this.originalOrganizationTypeId;
  }

  hasContactChanged(): boolean {
    const email = this.organizationForm.get('address.email')?.value;
    return email !== this.originalEmail;
  }

  hasWebsiteChanged(): boolean {
    const website = this.organizationForm.get('website')?.value ?? '';
    const original = this.originalWebsite ?? '';
    return website !== original;
  }

  hasRegionalChanged(): boolean {
    const country = this.organizationForm.get('address.country')?.value;
    const timeZone = this.organizationForm.get('address.timeZone')?.value;
    return country !== this.originalCountry || timeZone !== this.originalTimeZone;
  }

  hasFinancialYearChanged(): boolean {
    const day = this.organizationForm.get('financialYear.yearEndDay')?.value;
    const month = this.organizationForm.get('financialYear.yearEndMonth')?.value;
    if (!this.originalFinancialYear) return false;
    return (
      String(day) !== String(this.originalFinancialYear.yearEndDay) ||
      String(month) !== String(this.originalFinancialYear.yearEndMonth)
    );
  }

  hasPaymentTermsChanged(): boolean {
    return (
      this.selectedPaymentTermPreset !== this.originalPaymentTermPreset ||
      this.paymentTermDays !== this.originalPaymentTermDays ||
      this.paymentInstructions !== this.originalPaymentInstructions
    );
  }

  getOrganizationTypeName(): string {
    const typeId = this.organizationForm.get('organizationType.typeId')?.value;
    if (!typeId || !this.organizationTypesMetadata) return 'Not set';
    const type = this.organizationTypesMetadata.find((t) => t.id === typeId);
    return type?.name || 'Unknown';
  }

  getFinancialYearEndDisplay(): string {
    const yearEndMonth = this.organizationForm.get('financialYear.yearEndMonth')?.value;
    const yearEndDay = this.organizationForm.get('financialYear.yearEndDay')?.value;

    if (!yearEndMonth || !yearEndDay) {
      return '—';
    }

    const monthIndex = parseInt(yearEndMonth, 10) - 1;
    const monthAbbr = this.monthAbbreviations[monthIndex] || `Month ${yearEndMonth}`;
    return `${monthAbbr}. ${yearEndDay}`;
  }

  getCountryDisplay(): string {
    const code = this.organizationForm.get('address.country')?.value;
    if (!code) return '—';
    const found = this.countries.find(
      (c) => c.cca2?.toLowerCase() === code.toLowerCase()
    );
    return found ? `${found.name} (${found.cca2})` : code;
  }

  copyDisplayNameToLegalName(): void {
    const displayName = this.organizationForm.get('names.displayName')?.value;
    if (displayName) {
      this.organizationForm.get('names.legalName')?.setValue(displayName);
    }
  }

  openNameDifferenceDialog(): void {
    const data: DialogData = {
      title: 'Display Name vs Legal Name',
      messages: [
        'Display Name is the public brand name shown across navigation, customer dashboards, and communication headers.',
        'Legal Name is the officially registered corporate name used for government compliance, tax reporting, and formal contracts.'
      ],
      confirmLabel: 'Understood',
      hideCancel: true
    };
    this.dialogService.open(Dialog, { data, header: 'Display Name vs Legal Name', width: '460px' });
  }

  confirmDisableOrganization(checked: boolean): void {
    if (!checked) {
      const data: DialogData = {
        title: 'Deactivate Organization?',
        messages: [
          'Deactivating this organization will mark it as <strong>inactive</strong>. All linked operations, invoicing actions, and active network connections will be suspended.',
          'You may reactivate this organization at any time by toggling this setting back on.'
        ],
        icon: 'warning',
        isHtml: true,
        confirmLabel: 'Deactivate',
        confirmColor: 'warn'
      };
      const ref = this.dialogService.open(Dialog, {
        data,
        width: '460px',
        header: 'Deactivate Organization?'
      });
      ref?.onClose.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.isOrganizationActive = false;
          this.messageService.add({
            severity: 'warn',
            summary: 'Organization Deactivated',
            detail: 'Organization status updated to inactive'
          });
        } else {
          this.isOrganizationActive = true;
        }
        this.cdr.markForCheck();
      });
    } else {
      this.isOrganizationActive = true;
      this.messageService.add({
        severity: 'success',
        summary: 'Organization Activated',
        detail: 'Organization is now active'
      });
    }
  }

  // --- Category 1: Updates ---
  updateOrganizationNames(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingNames.set(true);

    const formValue = this.organizationForm.value;
    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      names: formValue.names as CurrentOrganizationResponseNames,
      address: {
        ...(formValue.address as CurrentOrganizationResponseContact),
        addresses: this.addresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalNames = {
            displayName: this.currentOrganization.names.displayName,
            legalName: this.currentOrganization.names.legalName
          };
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Organization names updated successfully',
            life: 3000
          });
        }
        this.isUpdatingNames.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err.error?.message || 'Could not update names',
          life: 4000
        });
        this.isUpdatingNames.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  updateOrganizationType(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingOrganizationType.set(true);

    const formValue = this.organizationForm.value;
    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      organizationType: formValue.organizationType as CurrentOrganizationResponseType,
      address: {
        ...(formValue.address as CurrentOrganizationResponseContact),
        addresses: this.addresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalOrganizationTypeId = this.currentOrganization.organizationType.typeId;
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Organization type updated successfully',
            life: 3000
          });
        }
        this.isUpdatingOrganizationType.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err.error?.message || 'Could not update organization type',
          life: 4000
        });
        this.isUpdatingOrganizationType.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  updateDescription(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingDescription.set(true);

    const formValue = this.organizationForm.value;
    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      names: {
        displayName: this.currentOrganization.names.displayName,
        legalName: this.currentOrganization.names.legalName,
        description: formValue.names.description
      } as CurrentOrganizationResponseNames,
      address: {
        ...(formValue.address as CurrentOrganizationResponseContact),
        addresses: this.addresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalDescription = this.currentOrganization.names.description;
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Organization description saved',
            life: 3000
          });
        }
        this.isUpdatingDescription.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err.error?.message || 'Could not update description',
          life: 4000
        });
        this.isUpdatingDescription.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  updateContactEmail(): void {
    if (!this.currentOrganization || this.organizationForm.get('address.email')?.invalid) return;
    this.isUpdatingContact.set(true);

    const email = this.organizationForm.get('address.email')?.value;
    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      address: {
        ...this.currentOrganization.address,
        email,
        addresses: this.addresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalEmail = this.currentOrganization.address.email;
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Official email address updated',
            life: 3000
          });
        }
        this.isUpdatingContact.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err.error?.message || 'Could not update email',
          life: 4000
        });
        this.isUpdatingContact.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  // --- Address Management ---
  openAddAddressDialog(): void {
    this.editingAddressIndex = null;
    const defaultCountry = this.organizationForm.get('address.country')?.value || 'US';
    this.addressForm.reset({
      type: this.availableAddressTypes[0]?.name || 'STREET',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: defaultCountry
    });
    this.showAddressDialog = true;
  }

  openEditAddressDialog(index: number): void {
    const addr = this.addresses[index];
    if (!addr) return;
    this.editingAddressIndex = index;
    this.addressForm.reset({
      type: addr.type || 'STREET',
      addressLine1: addr.addresses?.[0] || '',
      addressLine2: addr.addresses?.[1] || '',
      city: addr.city || '',
      postalCode: addr.postalCode || '',
      country: addr.country || this.organizationForm.get('address.country')?.value || ''
    });
    this.showAddressDialog = true;
  }

  closeAddressDialog(): void {
    this.showAddressDialog = false;
    this.editingAddressIndex = null;
  }

  saveAddress(): void {
    if (this.addressForm.invalid || !this.currentOrganization) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.isSavingAddress.set(true);
    const val = this.addressForm.value;
    const addressLines: string[] = [val.addressLine1.trim()];
    if (val.addressLine2 && val.addressLine2.trim()) {
      addressLines.push(val.addressLine2.trim());
    }

    const updatedAddress: CurrentOrganizationResponseContactAddress = {
      type: val.type,
      addresses: addressLines,
      city: val.city.trim(),
      postalCode: val.postalCode.trim(),
      country: val.country
    };

    let newAddresses: CurrentOrganizationResponseContactAddress[];
    if (this.editingAddressIndex !== null) {
      newAddresses = [...this.addresses];
      newAddresses[this.editingAddressIndex] = updatedAddress;
    } else {
      newAddresses = [...this.addresses, updatedAddress];
    }

    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      address: {
        ...this.currentOrganization.address,
        addresses: newAddresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.addresses = [...(this.currentOrganization.address?.addresses || [])];
          this.messageService.add({
            severity: 'success',
            summary: 'Address Saved',
            detail: this.editingAddressIndex !== null ? 'Address updated successfully' : 'New address added',
            life: 3000
          });
          this.closeAddressDialog();
        }
        this.isSavingAddress.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to save address',
          life: 4000
        });
        this.isSavingAddress.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  openDeleteAddressDialog(index: number): void {
    this.addressIndexToDelete = index;
    this.showDeleteAddressDialog = true;
  }

  closeDeleteAddressDialog(): void {
    this.showDeleteAddressDialog = false;
    this.addressIndexToDelete = null;
  }

  confirmDeleteAddress(): void {
    if (this.addressIndexToDelete === null || !this.currentOrganization) return;
    this.isDeletingAddress.set(true);

    const newAddresses = this.addresses.filter((_, idx) => idx !== this.addressIndexToDelete);
    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      address: {
        ...this.currentOrganization.address,
        addresses: newAddresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.addresses = [...(this.currentOrganization.address?.addresses || [])];
          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Address removed successfully',
            life: 3000
          });
          this.closeDeleteAddressDialog();
        }
        this.isDeletingAddress.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to remove address',
          life: 4000
        });
        this.isDeletingAddress.set(false);
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

  // --- Category 2: Manage finances ---
  updateFinancialYear(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingFinancialYear.set(true);

    const day = this.organizationForm.get('financialYear.yearEndDay')?.value;
    const month = this.organizationForm.get('financialYear.yearEndMonth')?.value;

    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      financialYear: {
        yearEndDay: String(day),
        yearEndMonth: String(month)
      },
      address: {
        ...this.currentOrganization.address,
        addresses: this.addresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalFinancialYear = {
            yearEndDay: this.currentOrganization.financialYear.yearEndDay,
            yearEndMonth: this.currentOrganization.financialYear.yearEndMonth
          };
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Financial year settings updated',
            life: 3000
          });
        }
        this.isUpdatingFinancialYear.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update financial year',
          life: 4000
        });
        this.isUpdatingFinancialYear.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  updateRegionalSettings(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingRegional.set(true);

    const country = this.organizationForm.get('address.country')?.value;
    const timeZone = this.organizationForm.get('address.timeZone')?.value;

    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      address: {
        ...this.currentOrganization.address,
        country,
        timeZone,
        addresses: this.addresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalCountry = this.currentOrganization.address.country;
          this.originalTimeZone = this.currentOrganization.address.timeZone;
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Regional country and timezone updated',
            life: 3000
          });
        }
        this.isUpdatingRegional.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update regional settings',
          life: 4000
        });
        this.isUpdatingRegional.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  onPaymentTermPresetChange(presetValue: string): void {
    const found = this.paymentTermPresets.find((p) => p.value === presetValue);
    if (found) {
      this.paymentTermDays = found.days;
      this.paymentTermType = found.type;
    }
  }

  updatePaymentTerms(): void {
    this.isUpdatingPaymentTerms.set(true);
    setTimeout(() => {
      this.originalPaymentTermPreset = this.selectedPaymentTermPreset;
      this.originalPaymentTermDays = this.paymentTermDays;
      this.originalPaymentInstructions = this.paymentInstructions;
      try {
        this.localStorage.setItem('org_payment_terms', JSON.stringify({
          preset: this.selectedPaymentTermPreset,
          days: this.paymentTermDays,
          type: this.paymentTermType,
          instructions: this.paymentInstructions
        }));
      } catch {
        // Ignore
      }
      this.isUpdatingPaymentTerms.set(false);
      this.messageService.add({
        severity: 'success',
        summary: 'Payment Terms Saved',
        detail: 'Default payment terms and invoice instructions updated',
        life: 3000
      });
      this.cdr.markForCheck();
    }, 400);
  }

  // --- Category 3: Connected sites ---
  updateWebsite(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingWebsite.set(true);

    const website = this.organizationForm.get('website')?.value;
    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      website,
      address: {
        ...this.currentOrganization.address,
        addresses: this.addresses
      }
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalWebsite = this.currentOrganization.website;
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'Official website URL updated',
            life: 3000
          });
        }
        this.isUpdatingWebsite.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update website',
          life: 4000
        });
        this.isUpdatingWebsite.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  getSafeUrl(url?: string): string {
    if (!url) return '#';
    const trimmed = url.trim();
    if (!trimmed) return '#';
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`;
    }
    return trimmed;
  }

  normalizePlatformType(rawType?: string): ExternalPlatformType | null {
    const upper = (rawType || '').trim().toUpperCase();
    if (upper === 'FACEBOOK') return 'FACEBOOK';
    if (upper === 'X' || upper === 'TWITTER') return 'X';
    if (upper === 'INSTAGRAM') return 'INSTAGRAM';
    if (upper === 'LINKEDIN') return 'LINKEDIN';
    return null;
  }

  private syncExternalLinksFromResponse(links?: CurrentOrganizationResponseExternalLink[]): void {
    const nextForm: Record<ExternalPlatformType, string> = {
      FACEBOOK: '',
      X: '',
      INSTAGRAM: '',
      LINKEDIN: ''
    };

    for (const item of links || []) {
      const normalized = this.normalizePlatformType(item?.linkType);
      if (normalized && item?.url?.trim()) {
        nextForm[normalized] = item.url.trim();
      }
    }

    this.socialLinksForm = { ...nextForm };
    this.originalSocialLinksForm = { ...nextForm };
    this.rebuildExternalLinksList();
  }

  private rebuildExternalLinksList(): void {
    const list: ExternalLinkItem[] = [];
    for (const p of this.externalLinkPlatforms) {
      const url = (this.socialLinksForm[p.value] || '').trim();
      if (url) {
        list.push({
          id: p.value,
          platform: p.value,
          url: this.getSafeUrl(url),
          label: p.label
        });
      }
    }
    this.externalLinks = list;
  }

  hasExternalLinksChanged(): boolean {
    return this.externalLinkPlatforms.some(
      (p) => (this.socialLinksForm[p.value] || '').trim() !== (this.originalSocialLinksForm[p.value] || '').trim()
    );
  }

  isPlatformConnected(platform: ExternalPlatformType): boolean {
    return !!(this.originalSocialLinksForm[platform] || '').trim();
  }

  getConnectedPlatformsCount(): number {
    return this.externalLinkPlatforms.filter((p) => !!(this.originalSocialLinksForm[p.value] || '').trim()).length;
  }

  addExternalLink(): void {
    const url = this.newLinkUrl.trim();
    if (!url) {
      this.messageService.add({
        severity: 'warn',
        summary: 'URL Required',
        detail: 'Please enter a valid profile URL'
      });
      return;
    }

    const platform = this.normalizePlatformType(this.newLinkPlatform) || 'LINKEDIN';
    this.socialLinksForm[platform] = this.getSafeUrl(url);
    this.rebuildExternalLinksList();
    this.newLinkUrl = '';
    this.saveExternalLinks();
  }

  removeExternalLink(index: number): void {
    const target = this.externalLinks[index];
    if (!target) return;
    this.clearPlatformLink(target.platform);
  }

  clearPlatformLink(platform: ExternalPlatformType): void {
    const wasSaved = !!(this.originalSocialLinksForm[platform] || '').trim();
    this.socialLinksForm[platform] = '';
    this.rebuildExternalLinksList();
    if (wasSaved) {
      this.saveExternalLinks();
    }
  }

  saveExternalLinks(): void {
    this.rebuildExternalLinksList();
    if (!this.currentOrganization) return;

    this.isUpdatingExternalLinks.set(true);

    const payloadLinks: CurrentOrganizationResponseExternalLink[] = [];
    for (const p of this.externalLinkPlatforms) {
      const raw = (this.socialLinksForm[p.value] || '').trim();
      if (raw) {
        payloadLinks.push({ linkType: p.value, url: this.getSafeUrl(raw) });
      }
    }

    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      address: {
        ...this.currentOrganization.address,
        addresses: this.addresses
      },
      externalLinks: payloadLinks
    };

    const updateObs = this.organizationService.updateCurrentOrganization(request);
    if (!updateObs) {
      this.originalSocialLinksForm = { ...this.socialLinksForm };
      this.isUpdatingExternalLinks.set(false);
      return;
    }

    updateObs.subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.syncExternalLinksFromResponse(this.currentOrganization.externalLinks || payloadLinks);
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: 'External social profile links updated successfully',
            life: 3000
          });
        }
        this.isUpdatingExternalLinks.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err.error?.message || 'Failed to update external links',
          life: 4000
        });
        this.isUpdatingExternalLinks.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  getPlatformLabel(platform: string): string {
    const normalized = this.normalizePlatformType(platform);
    const found = this.externalLinkPlatforms.find((p) => p.value === normalized);
    return found?.label || platform;
  }

  // --- Category 4: Organization network keys ---
  loadNetworkKeys(): void {
    this.isLoadingNetworkKeys = true;
    this.networkKeyService.getActiveKeys().subscribe({
      next: (res) => {
        this.isLoadingNetworkKeys = false;
        this.networkKeys = res.success && res.data ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingNetworkKeys = false;
        this.networkKeys = [];
        this.cdr.markForCheck();
      }
    });
  }

  openCreateNetworkKeyDialog(): void {
    this.newNetworkKeyName = 'Primary Network Key';
    this.showCreateNetworkKeyDialog = true;
  }

  generateNetworkKey(): void {
    this.isGeneratingNetworkKey = true;
    this.networkKeyService.generateNetworkKey({ name: this.newNetworkKeyName }).subscribe({
      next: (res) => {
        this.isGeneratingNetworkKey = false;
        this.showCreateNetworkKeyDialog = false;
        if (res.success && res.data) {
          this.networkKeys = [res.data, ...this.networkKeys];
          this.messageService.add({
            severity: 'success',
            summary: 'Key Generated',
            detail: 'Merra Network Key has been generated successfully'
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isGeneratingNetworkKey = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Generation Failed',
          detail: err.error?.message || 'Failed to generate network key'
        });
        this.cdr.markForCheck();
      }
    });
  }

  toggleNetworkKeyVisibility(keyId: string): void {
    this.visibleNetworkKeys[keyId] = !this.visibleNetworkKeys[keyId];
  }

  isNetworkKeyVisible(keyId: string): boolean {
    return !!this.visibleNetworkKeys[keyId];
  }

  getMaskedNetworkKey(key: string, isVisible: boolean): string {
    if (isVisible) return key;
    if (key.length <= 16) return '••••••••••••••••';
    return key.slice(0, 9) + '••••••••••••••••' + key.slice(-4);
  }

  copyNetworkKeyToClipboard(key: string): void {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(key).then(() => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: 'Network Key copied to clipboard',
          life: 2000
        });
      });
    }
  }

  openDeleteNetworkKeyDialog(key: NetworkKeyResponse): void {
    this.selectedNetworkKeyToDelete = key;
    this.showDeleteNetworkKeyDialog = true;
  }

  closeDeleteNetworkKeyDialog(): void {
    this.showDeleteNetworkKeyDialog = false;
    this.selectedNetworkKeyToDelete = null;
  }

  confirmDeleteNetworkKey(): void {
    if (!this.selectedNetworkKeyToDelete) return;
    this.isDeletingNetworkKey = true;
    this.networkKeyService.deleteNetworkKey(this.selectedNetworkKeyToDelete.id).subscribe({
      next: (res) => {
        this.isDeletingNetworkKey = false;
        this.showDeleteNetworkKeyDialog = false;
        if (res.success) {
          this.networkKeys = this.networkKeys.filter(
            (k) => k.id !== this.selectedNetworkKeyToDelete?.id
          );
          this.messageService.add({
            severity: 'success',
            summary: 'Key Revoked',
            detail: 'Merra Network Key has been revoked'
          });
        }
        this.selectedNetworkKeyToDelete = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeletingNetworkKey = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Revocation Failed',
          detail: err.error?.message || 'Failed to revoke key'
        });
        this.cdr.markForCheck();
      }
    });
  }

  // Invitations
  loadInvitations(): void {
    this.isLoadingInvitations = true;
    this.invitationService.getInvitations().subscribe({
      next: (res) => {
        this.isLoadingInvitations = false;
        this.invitations = res.success && res.data ? res.data : [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingInvitations = false;
        this.invitations = [];
        this.cdr.markForCheck();
      }
    });
  }

  createInvitation(sendEmail: boolean): void {
    const email = this.inviteeEmail.trim().toLowerCase();
    if (!email) {
      this.invitationNotice = {
        title: 'Email Required',
        message: 'Please enter the invitee email address before generating an invitation.',
        isAlreadyMember: false
      };
      this.cdr.markForCheck();
      return;
    }

    const emailValidationError = this.validateInviteeEmailAddress(email);
    if (emailValidationError) {
      this.lastCreatedInvitation = null;
      this.invitationNotice = emailValidationError;
      this.cdr.markForCheck();
      return;
    }

    this.invitationNotice = null;
    this.isCreatingInvitation = true;
    this.invitationService
      .createInvitation({
        inviteeEmail: email,
        role: this.selectedInvitationRole,
        sendEmail
      })
      .subscribe({
        next: (res) => {
          this.isCreatingInvitation = false;
          if (res.success && res.data) {
            this.invitationNotice = null;
            this.lastCreatedInvitation = res.data;
            this.invitations = [res.data, ...this.invitations];
            this.inviteeEmail = '';
            this.messageService.add({
              severity: 'success',
              summary: sendEmail ? 'Invitation Link Sent' : 'Invitation Token Generated',
              detail: res.message || (sendEmail ? 'Invitation email sent.' : 'Token ready to share.')
            });
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isCreatingInvitation = false;
          const msg: string = err?.error?.message || 'Failed to create invitation.';
          const isAlreadyMember = msg.toLowerCase().includes('already a member');
          this.lastCreatedInvitation = null;
          this.invitationNotice = {
            title: isAlreadyMember ? 'Already a Member of This Organization' : 'Cannot Send Invitation',
            message: msg,
            isAlreadyMember
          };
          this.cdr.markForCheck();
        }
      });
  }

  closeInvitationNotice(): void {
    this.invitationNotice = null;
    this.cdr.markForCheck();
  }

  applySuggestedEmail(suggestedEmail: string): void {
    this.inviteeEmail = suggestedEmail;
    this.invitationNotice = null;
    this.cdr.markForCheck();
  }

  private validateInviteeEmailAddress(email: string): {
    title: string;
    message: string;
    isAlreadyMember: boolean;
    suggestedEmail?: string;
  } | null {
    const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,24}$/;
    if (!strictEmailRegex.test(email)) {
      return {
        title: 'Invalid Email Format',
        message: `"${email}" is not a valid email address. Please enter a valid email (e.g., colleague@company.com).`,
        isAlreadyMember: false
      };
    }

    const atIdx = email.lastIndexOf('@');
    const localPart = email.substring(0, atIdx);
    const domain = email.substring(atIdx + 1).toLowerCase();

    if (
      localPart.startsWith('.') ||
      localPart.endsWith('.') ||
      localPart.includes('..') ||
      domain.includes('..') ||
      domain.startsWith('-') ||
      domain.endsWith('-')
    ) {
      return {
        title: 'Invalid Email Format',
        message: `"${email}" contains invalid characters or dot placement.`,
        isAlreadyMember: false
      };
    }

    const suggestedDomain = this.findMisspelledDomainSuggestion(domain);
    if (suggestedDomain) {
      const suggestedEmail = `${localPart}@${suggestedDomain}`;
      return {
        title: 'Invalid or Misspelled Email Domain',
        message: `The domain "@${domain}" appears to be misspelled. Did you mean "${suggestedEmail}"?`,
        isAlreadyMember: false,
        suggestedEmail
      };
    }

    return null;
  }

  private findMisspelledDomainSuggestion(domain: string): string | null {
    if (this.knownEmailDomains.includes(domain)) {
      return null;
    }

    const collapsed = domain.replace(/(.)\1+/g, '$1');
    for (const known of this.knownEmailDomains) {
      const knownCollapsed = known.replace(/(.)\1+/g, '$1');
      if (collapsed === knownCollapsed) {
        return known;
      }
      const dist = this.getLevenshteinDistance(domain, known);
      if (dist >= 1 && dist <= 2) {
        return known;
      }
    }

    return null;
  }

  private getLevenshteinDistance(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
      new Array(b.length + 1).fill(0)
    );
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[a.length][b.length];
  }

  copyInvitationText(text: string, label: string): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: `${label} copied to clipboard`
      });
    });
  }

  revokeInvitation(invitation: InvitationResponse): void {
    this.invitationService.revokeInvitation(invitation.id).subscribe({
      next: () => {
        this.invitations = this.invitations.filter((i) => i.id !== invitation.id);
        if (this.lastCreatedInvitation?.id === invitation.id) {
          this.lastCreatedInvitation = null;
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Invitation Revoked',
          detail: `Invitation for ${invitation.inviteeEmail} has been revoked`
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Revocation Failed',
          detail: err.error?.message || 'Failed to revoke invitation'
        });
      }
    });
  }

  backToProfile(): void {
    this.router.navigate(['/main/organization']);
  }
}
