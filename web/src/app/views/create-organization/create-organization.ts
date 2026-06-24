import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
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
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Config, RestCountriesSelection } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import { UtilityService } from '../../shared/services/utility-service';

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
    MatAutocompleteModule,
    MatIconModule
  ],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss',
})
export class CreateOrganization implements OnInit {
  private organizationService = inject(OrganizationService);
  private utilityService = inject(UtilityService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activatedRoute = inject(ActivatedRoute);
  private new_organization: NewOrganizationResponse | null = null;
  private localStorage = inject(LocalStorageService);

  private cdr = inject(ChangeDetectorRef);

  public organizationMetadata: OrganizationMetaDataResponse | null = null;
  public countries: RestCountriesSelection = [];
  public filteredCountries: RestCountriesSelection = [];
  organizationForm!: FormGroup;
  isSubmitting = false;
  daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  get addresses(): FormArray {
    return this.organizationForm.get('addresses') as FormArray;
  }

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

  createAddressGroup(): FormGroup {
    const defaultCountry = this.organizationForm?.get('country')?.value || '';
    return this.fb.group({
      type: ['', Validators.required],
      attentionTo: [''],
      addresses: this.fb.array(
        [this.fb.control('', Validators.required)],
        { validators: [Validators.required, this.atLeastOneRequired.bind(this)] }
      ),
      city: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: [defaultCountry, Validators.required]
    });
  }

  atLeastOneRequired(control: AbstractControl): ValidationErrors | null {
    const array = control as FormArray;
    if (!array || array.length === 0) {
      return { required: true };
    }
    const hasValue = array.controls.some(ctrl => ctrl.value && ctrl.value.trim() !== '');
    return hasValue ? null : { required: true };
  }

  private initializeForm(email?: string | null): void {
    this.organizationForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      type: ['', Validators.required],
      email: [email || '', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      yearEndMonth: [null, Validators.required],
      yearEndDay: [null, Validators.required],
      currency: ['', Validators.required],
      addresses: this.fb.array([this.createAddressGroup()])
    });
  }

  private loadCountries(): void {
    this.utilityService.getCountries().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          const countryList = response.data as any[];
          this.countries = countryList.map(c => ({
            name: c.countryName,
            cca2: c.isoAlpha2Code,
            currency: c.symbol || 'N/A'
          }));
          setTimeout(() => {
            this.filteredCountries = [...this.countries];
            this.cdr.detectChanges();
          });
        }
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
        this.snackBar.open('Failed to load countries', 'Close', {
          duration: 3000
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
    const addressControls = this.addresses.controls;
    addressControls.forEach(control => {
      const addrCountry = control.get('country');
      if (addrCountry && (!addrCountry.value || addrCountry.pristine)) {
        addrCountry.setValue(countryCode);
      }
    });
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
    console.log("form value => ", formValue);

    const organizationRequest: CreateOrganizationRequest = {
      displayName: formValue.displayName,
      type: formValue.type,
      email: formValue.email,
      country: formValue.country,
      financialYear: {
        yearEndMonth: formValue.yearEndMonth,
        yearEndDay: formValue.yearEndDay
      } as FinancialYear,
      currency: formValue.currency,
      addresses: formValue.addresses
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

  addAddress(): void {
    this.addresses.push(this.createAddressGroup());
  }

  removeAddress(index: number): void {
    if (this.addresses.length > 1) {
      this.addresses.removeAt(index);
    }
  }

  getAddressLines(addressGroup: any): FormArray {
    return addressGroup.get('addresses') as FormArray;
  }

  addAddressLine(addressGroup: any): void {
    const lines = this.getAddressLines(addressGroup);
    if (lines.length < 2) {
      lines.push(this.fb.control(''));
    }
  }

  removeAddressLine(addressGroup: any, index: number): void {
    const lines = this.getAddressLines(addressGroup);
    if (lines.length > 1) {
      lines.removeAt(index);
    }
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

