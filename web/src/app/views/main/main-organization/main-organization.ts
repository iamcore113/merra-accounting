import { Component, OnInit, ViewEncapsulation, inject, signal, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
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

import { Dialog, DialogData } from '../../../shared/components/dialog/dialog';
import { OrganizationService } from '../../../shared/services/organization-service';
import { NetworkKeyService } from '../../../shared/services/network-key-service';
import { UtilityService } from '../../../shared/services/utility-service';
import {
  CurrentOrganizationResponse,
  OrganizationMetaDataResponse,
  OrganizationTypesMetaData,
  CurrentOrganizationResponseNames,
  CurrentOrganizationResponseType,
  CurrentOrganizationResponseContact,
  CurrentOrganizationResponseFinancialYear,
  CurrentOrganizationResponseContactAddress
} from '../../../shared/models/organization';
import { NetworkKeyResponse } from '../../../shared/models/network-key';
import { Config } from '../../../shared/models/api_response';
import { OrganizationProfileDialog, OrganizationImageDialog } from './organization-profile-dialog';

export { OrganizationProfileDialog, OrganizationImageDialog };

@Component({
  selector: 'app-main-organization',
  standalone: true,
  imports: [
    CommonModule,
    AccordionModule,
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
    TitleCasePipe,
  ],
  templateUrl: './main-organization.html',
  styleUrl: './main-organization.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainOrganization implements OnInit {
  public organizationService = inject(OrganizationService);
  private readonly networkKeyService = inject(NetworkKeyService);
  private readonly utilityService = inject(UtilityService);
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  private monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  getFinancialYearEndDisplay(): string {
    const yearEndMonth = this.organizationForm.get('financialYear.yearEndMonth')?.value;
    const yearEndDay = this.organizationForm.get('financialYear.yearEndDay')?.value;

    if (!yearEndMonth || !yearEndDay) {
      return '—';
    }

    const monthIndex = parseInt(yearEndMonth, 10) - 1;
    const monthAbbr = this.monthAbbreviations[monthIndex] || '???';
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

  currentOrganization: CurrentOrganizationResponse | undefined;

  public organizationTypesMetadata: OrganizationTypesMetaData[] = [];
  public availableAddressTypes: { id: string; name: string }[] = [];
  public isLoadingOrganizationTypes = false;
  public isLoadingOrganization = false;
  public countries: any[] = [];
  public isLoadingCountries = false;

  // Active addresses managed by this component
  addresses: CurrentOrganizationResponseContactAddress[] = [];

  // Address dialog state
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
    country: ['', Validators.required],
  });

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

  organizationForm: FormGroup = this.fb.group({
    organizationId: [{ value: '', disabled: true }],
    organizationType: this.fb.group({
      typeId: ['', Validators.required],
      name: ['', Validators.required],
    }),
    names: this.fb.group({
      displayName: ['', Validators.required],
      legalName: ['', Validators.required],
      description: [''],
    }),
    address: this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      currency: ['', Validators.required],
      timeZone: ['', Validators.required],
    }),
    website: [''],
    createdDate: [{ value: '', disabled: true }],
    status: [{ value: '', disabled: true }],
    financialYear: this.fb.group({
      yearEndDay: ['', [Validators.required, Validators.min(1), Validators.max(31)]],
      yearEndMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
    }),
  });

  isEditingDescription = false;
  isEditingNames = false;
  isEditingOrganizationType = false;
  isEditingContact = false;
  isEditingWebsite = false;
  isEditingRegional = false;
  isEditingFinancialYear = false;

  isUpdatingNames = signal(false);
  isUpdatingDescription = signal(false);
  isUpdatingOrganizationType = signal(false);
  isUpdatingContact = signal(false);
  isUpdatingWebsite = signal(false);
  isUpdatingRegional = signal(false);
  isUpdatingFinancialYear = signal(false);

  private originalNames: { displayName: string; legalName: string } | null = null;
  private originalDescription: string | null = null;
  private originalOrganizationTypeId: string | null = null;
  private originalEmail: string | null = null;
  private originalWebsite: string | null = null;
  private originalCountry: string | null = null;
  private originalTimeZone: string | null = null;
  private originalFinancialYear: { yearEndDay: string; yearEndMonth: string } | null = null;

  hasNamesChanged = (): boolean => {
    const names = this.organizationForm.get('names')?.value;
    if (!this.originalNames || !names) return false;
    return (
      names.displayName !== this.originalNames.displayName ||
      names.legalName !== this.originalNames.legalName
    );
  };

  hasDescriptionChanged = (): boolean => {
    const description = this.organizationForm.get('names.description')?.value ?? '';
    const original = this.originalDescription ?? '';
    return description !== original;
  };

  hasOrganizationTypeChanged = (): boolean => {
    const typeId = this.organizationForm.get('organizationType.typeId')?.value;
    if (this.originalOrganizationTypeId === null || typeId === undefined) return false;
    return typeId !== this.originalOrganizationTypeId;
  };

  hasContactChanged = (): boolean => {
    const email = this.organizationForm.get('address.email')?.value;
    return email !== this.originalEmail;
  };

  hasWebsiteChanged = (): boolean => {
    const website = this.organizationForm.get('website')?.value ?? '';
    const original = this.originalWebsite ?? '';
    return website !== original;
  };

  hasRegionalChanged = (): boolean => {
    const country = this.organizationForm.get('address.country')?.value;
    const timeZone = this.organizationForm.get('address.timeZone')?.value;
    return country !== this.originalCountry || timeZone !== this.originalTimeZone;
  };

  hasFinancialYearChanged = (): boolean => {
    const day = this.organizationForm.get('financialYear.yearEndDay')?.value;
    const month = this.organizationForm.get('financialYear.yearEndMonth')?.value;
    if (!this.originalFinancialYear) return false;
    return (
      String(day) !== String(this.originalFinancialYear.yearEndDay) ||
      String(month) !== String(this.originalFinancialYear.yearEndMonth)
    );
  };

  getOrganizationTypeName(): string {
    const typeId = this.organizationForm.get('organizationType.typeId')?.value;
    if (!typeId || !this.organizationTypesMetadata) return 'Not set';
    const type = this.organizationTypesMetadata.find((t) => t.id === typeId);
    return type?.name || 'Unknown';
  }

  ngOnInit(): void {
    this.isLoadingOrganization = true;
    this.loadCountries();
    this.loadOrganizationTypesMetadata();
    this.loadNetworkKeys();
    this.organizationService.getCurrentOrganization().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalNames = {
            displayName: this.currentOrganization.names.displayName,
            legalName: this.currentOrganization.names.legalName,
          };
          this.originalDescription = this.currentOrganization.names.description;
          this.originalOrganizationTypeId = this.currentOrganization.organizationType.typeId;
          this.originalEmail = this.currentOrganization.address.email;
          this.originalWebsite = this.currentOrganization.website || '';
          this.originalCountry = this.currentOrganization.address.country;
          this.originalTimeZone = this.currentOrganization.address.timeZone;
          this.originalFinancialYear = {
            yearEndDay: String(this.currentOrganization.financialYear?.yearEndDay || ''),
            yearEndMonth: String(this.currentOrganization.financialYear?.yearEndMonth || ''),
          };

          this.addresses = [...(this.currentOrganization.address?.addresses || [])];

          this.organizationForm.patchValue({
            organizationId: this.currentOrganization.organizationId,
            organizationType: {
              typeId: this.currentOrganization.organizationType.typeId,
              name: this.currentOrganization.organizationType.name,
            },
            names: {
              displayName: this.currentOrganization.names.displayName,
              legalName: this.currentOrganization.names.legalName,
              description: this.currentOrganization.names.description,
            },
            address: {
              email: this.currentOrganization.address.email,
              country: this.currentOrganization.address.country,
              currency: this.currentOrganization.address.currency,
              timeZone: this.currentOrganization.address.timeZone,
            },
            website: this.currentOrganization.website,
            createdDate: this.currentOrganization.createdDate,
            status: this.currentOrganization.status,
            financialYear: {
              yearEndDay: this.currentOrganization.financialYear?.yearEndDay,
              yearEndMonth: this.currentOrganization.financialYear?.yearEndMonth,
            },
          });
        }
        this.isLoadingOrganization = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingOrganization = false;
        this.cdr.markForCheck();
      },
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
              currency: c.code || 'N/A',
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        this.isLoadingCountries = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
        this.isLoadingCountries = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadOrganizationTypesMetadata(): void {
    this.isLoadingOrganizationTypes = true;
    let verifiedData: OrganizationMetaDataResponse | null = null;
    this.organizationService.getOrganizationMetadata().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          verifiedData = (response as any).data as OrganizationMetaDataResponse;
        }
      },
      error: (error) => {
        console.error('Failed to load organization metadata:', error);
        this.isLoadingOrganizationTypes = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load organization metadata',
          life: 3000,
        });
        this.cdr.markForCheck();
      },
      complete: () => {
        this.organizationTypesMetadata = verifiedData?.organizationTypes || [];
        if (verifiedData?.organizationAddressTypes?.length) {
          this.availableAddressTypes = verifiedData.organizationAddressTypes.map((t) => ({
            id: t.id,
            name: t.name,
          }));
        } else {
          this.availableAddressTypes = [
            { id: 'STREET', name: 'Street Address' },
            { id: 'POBOX', name: 'Post Office Box' },
            { id: 'BILLING', name: 'Billing Address' },
            { id: 'SHIPPING', name: 'Shipping Address' },
          ];
        }
        this.isLoadingOrganizationTypes = false;
        this.cdr.markForCheck();
      },
    });
  }

  // --- Profile Dialog ---
  openOrganizationImageDialog(): void {
    this.dialogService.open(OrganizationProfileDialog, {
      header: 'Organization Profile',
      width: '600px',
      modal: true,
      data: {
        organization: this.currentOrganization,
        typeName: this.getOrganizationTypeName(),
        countryDisplay: this.getCountryDisplay(),
        financialYearDisplay: this.getFinancialYearEndDisplay(),
      },
    });
  }

  startDescriptionEditing(): void {
    this.isEditingDescription = true;
  }

  openNameDifferenceDialog(): void {
    const data: DialogData = {
      title: 'Display Name vs Legal Name',
      messages: [
        'Display Name is the public-facing name shown in the app.',
        'Legal Name is the registered name used for compliance, billing, and formal documents.',
      ],
      confirmLabel: 'Got it',
      hideCancel: true,
    };
    this.dialogService.open(Dialog, { data, header: 'Display Name vs Legal Name', width: '440px' });
  }

  isOrganizationActive = true;

  confirmDisableOrganization(checked: boolean): void {
    if (!checked) {
      const data: DialogData = {
        title: 'Disable Organization?',
        messages: [
          'Disabling this organization will mark it as <strong>inactive</strong>. While inactive, all associated accounts, transactions, and member operations will be suspended and no further activity can be recorded. This action can be reversed by re-enabling the organization, but any in-progress operations at the time of deactivation may be interrupted.',
          'Are you sure you want to proceed?',
        ],
        icon: 'warning',
        isHtml: true,
        confirmLabel: 'Disable',
        confirmColor: 'warn',
      };
      const ref = this.dialogService.open(Dialog, {
        data,
        width: '440px',
        header: 'Disable Organization?',
      });
      ref?.onClose.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.isOrganizationActive = false;
        } else {
          this.isOrganizationActive = true;
        }
        this.cdr.markForCheck();
      });
    } else {
      this.isOrganizationActive = true;
    }
  }

  copyDisplayNameToLegalName(): void {
    const displayName = this.organizationForm.get('names.displayName')?.value;
    if (displayName) {
      this.organizationForm.get('names.legalName')?.setValue(displayName);
    }
  }

  // --- Names Update ---
  updateOrganizationNames(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingNames.set(true);

    const formValue = this.organizationForm.value;
    const request: CurrentOrganizationResponse = {
      organizationId: this.currentOrganization.organizationId,
      organizationType: formValue.organizationType as CurrentOrganizationResponseType,
      names: formValue.names as CurrentOrganizationResponseNames,
      address: {
        ...(formValue.address as CurrentOrganizationResponseContact),
        addresses: this.addresses,
      },
      website: formValue.website,
      createdDate: this.currentOrganization.createdDate,
      status: this.currentOrganization.status,
      financialYear: formValue.financialYear as CurrentOrganizationResponseFinancialYear,
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalNames = {
            displayName: this.currentOrganization.names.displayName,
            legalName: this.currentOrganization.names.legalName,
          };
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Organization updated successfully',
            life: 3000,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update organization',
            life: 5000,
          });
        }
        this.isUpdatingNames.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'An error occurred while updating',
          life: 5000,
        });
        this.isUpdatingNames.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // --- Organization Type Update ---
  updateOrganizationType(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingOrganizationType.set(true);

    const formValue = this.organizationForm.value;
    const request: CurrentOrganizationResponse = {
      organizationId: this.currentOrganization.organizationId,
      organizationType: formValue.organizationType as CurrentOrganizationResponseType,
      names: formValue.names as CurrentOrganizationResponseNames,
      address: {
        ...(formValue.address as CurrentOrganizationResponseContact),
        addresses: this.addresses,
      },
      website: formValue.website,
      createdDate: this.currentOrganization.createdDate,
      status: this.currentOrganization.status,
      financialYear: formValue.financialYear as CurrentOrganizationResponseFinancialYear,
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalOrganizationTypeId = this.currentOrganization.organizationType.typeId;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Organization type updated successfully',
            life: 3000,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update organization type',
            life: 5000,
          });
        }
        this.isUpdatingOrganizationType.set(false);
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'An error occurred while updating',
          life: 5000,
        });
        this.isUpdatingOrganizationType.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // --- Description Update ---
  updateDescription(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingDescription.set(true);

    const formValue = this.organizationForm.value;
    const request: CurrentOrganizationResponse = {
      organizationId: this.currentOrganization.organizationId,
      organizationType: formValue.organizationType as CurrentOrganizationResponseType,
      names: {
        displayName: this.currentOrganization.names.displayName,
        legalName: this.currentOrganization.names.legalName,
        description: formValue.names.description,
      } as CurrentOrganizationResponseNames,
      address: {
        ...(formValue.address as CurrentOrganizationResponseContact),
        addresses: this.addresses,
      },
      website: formValue.website,
      createdDate: this.currentOrganization.createdDate,
      status: this.currentOrganization.status,
      financialYear: formValue.financialYear as CurrentOrganizationResponseFinancialYear,
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalDescription = this.currentOrganization.names.description;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Description updated successfully',
            life: 3000,
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update description',
            life: 5000,
          });
        }
        this.isUpdatingDescription.set(false);
        this.isEditingDescription = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'An error occurred while updating',
          life: 5000,
        });
        this.isUpdatingDescription.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // --- Contact Email Update ---
  updateContactEmail(): void {
    if (!this.currentOrganization) return;
    const emailControl = this.organizationForm.get('address.email');
    if (emailControl?.invalid) return;

    this.isUpdatingContact.set(true);
    const formValue = this.organizationForm.value;
    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      address: {
        ...this.currentOrganization.address,
        email: formValue.address.email,
        addresses: this.addresses,
      },
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalEmail = this.currentOrganization.address.email;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Contact email updated successfully',
            life: 3000,
          });
          this.isEditingContact = false;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update contact email',
            life: 5000,
          });
        }
        this.isUpdatingContact.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update contact email',
          life: 5000,
        });
        this.isUpdatingContact.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  cancelContactEditing(): void {
    this.organizationForm.get('address.email')?.setValue(this.originalEmail || '');
    this.isEditingContact = false;
  }

  // --- Website Update ---
  updateWebsite(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingWebsite.set(true);
    const website = this.organizationForm.get('website')?.value;

    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      website: website,
      address: {
        ...this.currentOrganization.address,
        addresses: this.addresses,
      },
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalWebsite = this.currentOrganization.website;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Website updated successfully',
            life: 3000,
          });
          this.isEditingWebsite = false;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update website',
            life: 5000,
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
          life: 5000,
        });
        this.isUpdatingWebsite.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // --- Regional / Country Update ---
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
        addresses: this.addresses,
      },
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalCountry = this.currentOrganization.address.country;
          this.originalTimeZone = this.currentOrganization.address.timeZone;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Regional settings updated successfully',
            life: 3000,
          });
          this.isEditingRegional = false;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update regional settings',
            life: 5000,
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
          life: 5000,
        });
        this.isUpdatingRegional.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // --- Financial Year Update ---
  updateFinancialYear(): void {
    if (!this.currentOrganization) return;
    this.isUpdatingFinancialYear.set(true);
    const day = this.organizationForm.get('financialYear.yearEndDay')?.value;
    const month = this.organizationForm.get('financialYear.yearEndMonth')?.value;

    const request: CurrentOrganizationResponse = {
      ...this.currentOrganization,
      financialYear: {
        yearEndDay: String(day),
        yearEndMonth: String(month),
      },
      address: {
        ...this.currentOrganization.address,
        addresses: this.addresses,
      },
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.originalFinancialYear = {
            yearEndDay: this.currentOrganization.financialYear.yearEndDay,
            yearEndMonth: this.currentOrganization.financialYear.yearEndMonth,
          };
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Financial year settings updated successfully',
            life: 3000,
          });
          this.isEditingFinancialYear = false;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update financial year',
            life: 5000,
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
          life: 5000,
        });
        this.isUpdatingFinancialYear.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ==========================================
  // ADDRESS MANAGEMENT METHODS
  // ==========================================

  openAddAddressDialog(): void {
    this.editingAddressIndex = null;
    const defaultCountry = this.organizationForm.get('address.country')?.value || 'US';
    this.addressForm.reset({
      type: this.availableAddressTypes[0]?.name || 'STREET',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: defaultCountry,
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
      country: addr.country || this.organizationForm.get('address.country')?.value || '',
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
      country: val.country,
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
        addresses: newAddresses,
      },
    };

    this.organizationService.updateCurrentOrganization(request).subscribe({
      next: (response) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          this.addresses = [...(this.currentOrganization.address?.addresses || [])];
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail:
              this.editingAddressIndex !== null
                ? 'Address updated successfully'
                : 'Address added successfully',
            life: 3000,
          });
          this.closeAddressDialog();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to update address',
            life: 5000,
          });
        }
        this.isSavingAddress.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to update address',
          life: 5000,
        });
        this.isSavingAddress.set(false);
        this.cdr.markForCheck();
      },
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
        addresses: newAddresses,
      },
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
            life: 3000,
          });
          this.closeDeleteAddressDialog();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: response.message || 'Failed to remove address',
            life: 5000,
          });
        }
        this.isDeletingAddress.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to remove address',
          life: 5000,
        });
        this.isDeletingAddress.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  getAddressCountryName(countryCode: string): string {
    if (!countryCode) return '';
    const found = this.countries.find(
      (c) => c.cca2?.toLowerCase() === countryCode.toLowerCase()
    );
    return found ? found.name : countryCode;
  }

  getAddressTypeIcon(type: string): string {
    const t = (type || '').toUpperCase();
    if (t.includes('BILLING')) return 'pi-receipt';
    if (t.includes('SHIPPING') || t.includes('DELIVERY')) return 'pi-truck';
    if (t.includes('POBOX') || t.includes('POST')) return 'pi-inbox';
    if (t.includes('STREET') || t.includes('PHYSICAL')) return 'pi-building';
    return 'pi-map-marker';
  }

  // ==========================================
  // NETWORK KEY MANAGEMENT METHODS
  // ==========================================

  loadNetworkKeys(): void {
    this.isLoadingNetworkKeys = true;
    this.networkKeyService.getActiveKeys().subscribe({
      next: (res) => {
        this.isLoadingNetworkKeys = false;
        if (res.success && res.data) {
          this.networkKeys = res.data;
        } else {
          this.networkKeys = [];
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingNetworkKeys = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load network keys',
        });
        this.cdr.markForCheck();
      },
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
            detail: 'Merra Network Key has been generated successfully',
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isGeneratingNetworkKey = false;
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
          life: 2000,
        });
      });
    } else {
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
            detail: 'Merra Network Key has been revoked',
          });
        }
        this.selectedNetworkKeyToDelete = null;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isDeletingNetworkKey = false;
        const msg = err.error?.message || err.message || 'Failed to revoke network key';
        this.messageService.add({
          severity: 'error',
          summary: 'Revocation Failed',
          detail: msg,
        });
        this.cdr.markForCheck();
      },
    });
  }
}
