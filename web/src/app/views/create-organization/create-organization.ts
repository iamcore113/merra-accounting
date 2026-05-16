import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrganizationService } from '../../shared/services/organization-service';
import { CreateOrganizationRequest, FinancialYear, NewOrganizationResponse, OrganizationMetaDataResponse } from '../../shared/models/organization';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { Config, RestCountriesSelection, RestCountryList } from '../../shared/models/api_response';
import { CountryApiService } from '../../shared/services/country-api-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';

@Component({
  selector: 'app-create-organization',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule
  ],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss',
})
export class CreateOrganization implements OnInit {
  private organizationService = inject(OrganizationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activatedRoute = inject(ActivatedRoute);
  private countryApiService = inject(CountryApiService);
  private new_organization: NewOrganizationResponse | null = null;
  private localStorage = inject(LocalStorageService);

  private cdr = inject(ChangeDetectorRef);

  public organizationMetadata: OrganizationMetaDataResponse | null = null;
  public countries: RestCountriesSelection = [];
  public filteredCountries: RestCountriesSelection = [];
  organizationForm!: FormGroup;
  isSubmitting = false;
  daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  ngOnInit(): void {
    const email = this.activatedRoute.snapshot.paramMap.get('email');
    this.initializeForm(email);
    this.loadOrganizationMetadata();
    this.loadCountries();
  }

  private loadOrganizationMetadata(): void {
    let verifiedData: OrganizationMetaDataResponse | null = null;
    this.organizationService.getOrganizationMetadata().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          verifiedData = (response as any).data as OrganizationMetaDataResponse;
        }
      },
      error: (error) => {
        console.error('Failed to load organization metadata:', error);
        this.snackBar.open('Failed to load organization metadata', 'Close', {
          duration: 3000
        });
      },
      complete: () => {
        this.organizationMetadata = verifiedData;
        console.log('Organization metadata loaded:', this.organizationMetadata);
      }
    });
  }

  private initializeForm(email?: string | null): void {
    this.organizationForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      type: ['', Validators.required],
      email: [email || '', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      yearEndMonth: [null, Validators.required],
      yearEndDay: [null, Validators.required],
      currency: ['', Validators.required]
    });
  }

  private loadCountries(): void {
    let collect_response: RestCountryList;
    this.countryApiService.getCountries().subscribe({
      next: (response: RestCountryList) => {
        collect_response = response;
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
        this.snackBar.open('Failed to load countries', 'Close', {
          duration: 3000
        });
      },
      complete: () => {
        // Transform the response to the format we need
        this.countries = collect_response.map(country => ({
          name: country.name.common,
          cca2: country.cca2,
          currency: country.currencies && Object.values(country.currencies)[0]?.name || 'N/A'
        }));
        setTimeout(() => {
          this.filteredCountries = [...this.countries];
          this.cdr.detectChanges();
        });
      }
    });
  }

  onCountryInput(searchTerm: string): void {
    setTimeout(() => {
      if (!searchTerm) {
        this.filteredCountries = [...this.countries];
      } else {
        this.filteredCountries = this.countries.filter(country =>
          country.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      this.cdr.detectChanges();
    });
  }

  onCountrySelected(countryCode: string): void {
    this.onCountryChange(countryCode);
  }

  onCountryChange(countryCode: string): void {
    if (countryCode) {
      const selectedCountry = this.countries.find(country => country.cca2 === countryCode);
      if (selectedCountry && selectedCountry.currency !== 'N/A') {
        this.organizationForm.patchValue({ currency: selectedCountry.currency });
      }
    } else {
      this.organizationForm.patchValue({ currency: '' });
    }
  }

  onSubmit(): void {
    if (this.organizationForm.invalid) {
      this.markFormGroupTouched(this.organizationForm);
      return;
    }

    this.isSubmitting = true;

    const formValue = this.organizationForm.value;

    const organizationRequest: CreateOrganizationRequest = {
      displayName: formValue.displayName,
      type: formValue.type,
      email: formValue.email,
      country: formValue.country,
      financialYear: {
        yearEndMonth: formValue.yearEndMonth,
        yearEndDay: formValue.yearEndDay
      } as FinancialYear,
      currency: formValue.currency
    };

    let neworganization: NewOrganizationResponse | null = null;
    this.organizationService.createOrganization(organizationRequest).subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          neworganization = (response as any).data as NewOrganizationResponse;
        }
      },
      error: (error) => {
        console.error('Error creating organization:', error);
        this.snackBar.open('Failed to create organization. Please try again.', 'Error', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.snackBar.open('Organization created successfully!', 'Success', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/main']);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/no-organization']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
