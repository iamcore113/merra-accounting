import { Component, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Dialog, DialogData } from '../../../shared/components/dialog/dialog';
import { OrganizationService } from '../../../shared/services/organization-service';
import { CurrentOrganizationResponse, OrganizationMetaDataResponse, OrganizationTypesMetaData, CurrentOrganizationResponseNames, CurrentOrganizationResponseType, CurrentOrganizationResponseContact, CurrentOrganizationResponseFinancialYear } from '../../../shared/models/organization';
import { Config } from '../../../shared/models/api_response';
import { UtilityService } from '../../../shared/services/utility-service';

@Component({
  selector: 'app-organization-image-dialog',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <section class="organization-image-dialog">
      <div class="organization-image-placeholder">
        <i class="pi pi-building organization-image-icon"></i>
      </div>
      <div class="dialog-actions">
        <p-button label="Close" [size]="'small'" [outlined]="true" (click)="close()"></p-button>
      </div>
    </section>
  `,
})
export class OrganizationImageDialog {
  private readonly dialogRef = inject(DynamicDialogRef);

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-main-organization',
  standalone: true,
  imports: [
    AccordionModule,
    ToggleSwitchModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ProgressSpinnerModule,
    TooltipModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    TitleCasePipe
  ],
  templateUrl: './main-organization.html',
  styleUrl: './main-organization.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainOrganization implements OnInit {
  public organizationService = inject(OrganizationService);
  private readonly utilityService = inject(UtilityService);
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

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

  currentOrganization: CurrentOrganizationResponse | undefined;

  public organizationTypesMetadata: OrganizationTypesMetaData[] = [];
  public isLoadingOrganizationTypes = false;
  public isLoadingOrganization = false;
  public countries: any[] = [];
  public isLoadingCountries = false;
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
      yearEndDay: [''],
      yearEndMonth: [''],
    }),
  });
  isEditingDescription = false;
  isEditingNames = false;
  isEditingOrganizationType = false;
  isUpdatingNames = signal(false);
  isUpdatingDescription = signal(false);
  isUpdatingOrganizationType = signal(false);
  private originalNames: { displayName: string; legalName: string } | null = null;
  private originalDescription: string | null = null;
  private originalOrganizationTypeId: string | null = null;

  hasNamesChanged = (): boolean => {
    const names = this.organizationForm.get('names')?.value;
    if (!this.originalNames || !names) return false;
    return names.displayName !== this.originalNames.displayName ||
      names.legalName !== this.originalNames.legalName;
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

  getOrganizationTypeName(): string {
    const typeId = this.organizationForm.get('organizationType.typeId')?.value;
    if (!typeId || !this.organizationTypesMetadata) return 'Not set';
    const type = this.organizationTypesMetadata.find(t => t.id === typeId);
    return type?.name || 'Unknown';
  }

  ngOnInit(): void {
    this.isLoadingOrganization = true;
    this.loadCountries();
    this.loadOrganizationTypesMetadata();
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
      },
      error: () => {
        this.isLoadingOrganization = false;
      }
    });
  }

  private loadCountries(): void {
    this.isLoadingCountries = true;
    this.utilityService.getCountries().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          const countryList = response.data as any[];
          this.countries = countryList.map(c => ({
            name: c.countryName,
            cca2: c.isoAlpha2Code,
            currency: c.code || 'N/A'
          })).sort((a, b) => a.name.localeCompare(b.name));
        }
        this.isLoadingCountries = false;
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
        this.isLoadingCountries = false;
      }
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
          life: 3000
        });
      },
      complete: () => {
        this.organizationTypesMetadata = verifiedData?.organizationTypes || [];
        this.isLoadingOrganizationTypes = false;
      }
    });
  }

  openOrganizationImageDialog(): void {
    this.dialogService.open(OrganizationImageDialog, {
      header: 'Organization Profile',
      width: '380px'
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
        'Legal Name is the registered name used for compliance, billing, and formal documents.'
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
          'Are you sure you want to proceed?'
        ],
        icon: 'warning',
        isHtml: true,
        confirmLabel: 'Disable',
        confirmColor: 'warn',
      };
      const ref = this.dialogService.open(Dialog, { data, width: '440px', header: 'Disable Organization?' });
      ref?.onClose.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.isOrganizationActive = false;
        } else {
          this.isOrganizationActive = true;
        }
      });
    } else {
      this.isOrganizationActive = true;
    }
  }

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
        addresses: this.currentOrganization.address?.addresses || []
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
            legalName: this.currentOrganization.names.legalName
          };
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Organization updated successfully', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message || 'Failed to update organization', life: 5000 });
        }
        this.isUpdatingNames.set(false);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'An error occurred while updating', life: 5000 });
        this.isUpdatingNames.set(false);
      }
    });
  }

  copyDisplayNameToLegalName(): void {
    const displayName = this.organizationForm.get('names.displayName')?.value;
    if (displayName) {
      this.organizationForm.get('names.legalName')?.setValue(displayName);
    }
  }

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
        addresses: this.currentOrganization.address?.addresses || []
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
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Organization type updated successfully', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message || 'Failed to update organization type', life: 5000 });
        }
        this.isUpdatingOrganizationType.set(false);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'An error occurred while updating', life: 5000 });
        this.isUpdatingOrganizationType.set(false);
      }
    });
  }

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
        description: formValue.names.description
      } as CurrentOrganizationResponseNames,
      address: {
        ...(formValue.address as CurrentOrganizationResponseContact),
        addresses: this.currentOrganization.address?.addresses || []
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
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Description updated successfully', life: 3000 });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message || 'Failed to update description', life: 5000 });
        }
        this.isUpdatingDescription.set(false);
        this.isEditingDescription = false;
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.message || 'An error occurred while updating', life: 5000 });
        this.isUpdatingDescription.set(false);
      }
    });
  }
}
