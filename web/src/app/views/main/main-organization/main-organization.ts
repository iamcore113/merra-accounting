import { Component, Inject, OnInit, ViewEncapsulation, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Dialog, DialogData } from '../../../shared/components/dialog/dialog';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { OrganizationService } from '../../../shared/services/organization-service';
import { CurrentOrganizationResponse, OrganizationMetaDataResponse, OrganizationTypesMetaData, CurrentOrganizationResponseNames, CurrentOrganizationResponseType, CurrentOrganizationResponseContact, CurrentOrganizationResponseFinancialYear } from '../../../shared/models/organization';
import { Config } from '../../../shared/models/api_response';
import { UtilityService } from '../../../shared/services/utility-service';

@Component({
  selector: 'app-organization-image-dialog',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <section class="organization-image-dialog">
      <h3 mat-dialog-title>Organization Profile</h3>
      <mat-dialog-content>
        <div class="organization-image-placeholder">
          <mat-icon class="organization-image-icon" fontSet="material-icons-outlined">domain</mat-icon>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" (click)="close()">Close</button>
      </mat-dialog-actions>
    </section>
  `,
})
export class OrganizationImageDialog {
  private readonly dialogRef = inject(MatDialogRef<OrganizationImageDialog>);

  close(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-main-organization',
  imports: [MatExpansionModule, MatIconModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule, MatTooltipModule, MatBottomSheetModule, ReactiveFormsModule, DatePipe, TitleCasePipe, MatProgressSpinnerModule],
  templateUrl: './main-organization.html',
  styleUrl: './main-organization.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainOrganization implements OnInit {
  public organizationService = inject(OrganizationService);
  private readonly utilityService = inject(UtilityService);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
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

  // TODO: finish this one
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
    })
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
        this.snackBar.open('Failed to load organization metadata', 'Close', {
          duration: 3000
        });
      },
      complete: () => {
        this.organizationTypesMetadata = verifiedData?.organizationTypes || [];
        this.isLoadingOrganizationTypes = false;
      }
    });
  }

  openOrganizationImageDialog(): void {
    this.dialog.open(OrganizationImageDialog);
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
    this.dialog.open(Dialog, { data });
  }

  isOrganizationActive = true;

  confirmDisableOrganization(event: MatSlideToggleChange): void {
    if (!event.checked) {
      event.source.checked = true;
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
      this.dialog.open(Dialog, { data, width: '440px' }).afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.isOrganizationActive = false;
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
          this.snackBar.open('Organization updated successfully', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(response.message || 'Failed to update organization', 'Close', { duration: 5000 });
        }
        this.isUpdatingNames.set(false);
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'An error occurred while updating', 'Close', { duration: 5000 });
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
          this.snackBar.open('Organization type updated successfully', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(response.message || 'Failed to update organization type', 'Close', { duration: 5000 });
        }
        this.isUpdatingOrganizationType.set(false);
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'An error occurred while updating', 'Close', { duration: 5000 });
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
          this.snackBar.open('Description updated successfully', 'Close', { duration: 3000 });
        } else {
          this.snackBar.open(response.message || 'Failed to update description', 'Close', { duration: 5000 });
        }
        this.isUpdatingDescription.set(false);
        this.isEditingDescription = false;
      },
      error: (error) => {
        this.snackBar.open(error.error?.message || 'An error occurred while updating', 'Close', { duration: 5000 });
        this.isUpdatingDescription.set(false);
      }
    });
  }
}
