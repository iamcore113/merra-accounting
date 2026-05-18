import { Component, Inject, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { delay } from 'rxjs/operators';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { OrganizationService } from '../../../shared/services/organization-service';
import { CountryApiService } from '../../../shared/services/country-api-service';
import { RestCountryList } from '../../../shared/models/api_response';
import { CurrentOrganizationResponse, OrganizationMetaDataResponse, OrganizationTypesMetaData } from '../../../shared/models/organization';
import { Config } from '../../../shared/models/api_response';

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
  selector: 'app-name-difference-sheet',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <section class="name-difference-sheet">
      <h3 class="name-difference-title">Display Name vs Legal Name</h3>
      <p class="name-difference-text">
        Display Name is the public-facing name shown in the app.
      </p>
      <p class="name-difference-text">
        Legal Name is the registered name used for compliance, billing, and formal documents.
      </p>
      <div class="name-difference-actions">
        <button matButton="filled" type="button" (click)="close()">Got it</button>
      </div>
    </section>
  `,
})
export class NameDifferenceSheet {
  private readonly bottomSheetRef = inject(MatBottomSheetRef<NameDifferenceSheet>);

  close(): void {
    this.bottomSheetRef.dismiss();
  }
}

@Component({
  selector: 'app-main-organization',
  imports: [MatExpansionModule, MatIconModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule, MatBottomSheetModule, ReactiveFormsModule, DatePipe],
  templateUrl: './main-organization.html',
  styleUrl: './main-organization.scss',
  encapsulation: ViewEncapsulation.None,
})
export class MainOrganization implements OnInit {
  public organizationService = inject(OrganizationService);
  private readonly countryApiService = inject(CountryApiService);
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
  public countries: RestCountryList = [];
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

  // TODO: finish this one
  ngOnInit(): void {
    this.isLoadingOrganization = true;
    this.loadCountries();
    this.loadOrganizationTypesMetadata();
    this.organizationService.getCurrentOrganization().pipe(delay(2000)).subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          this.currentOrganization = response.data as CurrentOrganizationResponse;
          console.log(this.currentOrganization);
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
    this.countryApiService.getCountries().pipe(delay(2000)).subscribe({
      next: (countries: RestCountryList) => {
        this.countries = countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
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
    this.organizationService.getOrganizationMetadata().pipe(delay(2000)).subscribe({
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

  openNameDifferenceSheet(): void {
    this.bottomSheet.open(NameDifferenceSheet);
  }
}
