import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
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
    MatIconModule,
    MatStepperModule
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

  @ViewChild('stepper') stepper!: MatStepper;

  public organizationMetadata: OrganizationMetaDataResponse | null = null;
  public countries: RestCountriesSelection = [];
  public filteredCountries: RestCountriesSelection = [];
  organizationForm!: FormGroup;
  isSubmitting = false;
  daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  get addresses(): FormArray {
    return this.organizationForm.get('addressStep.addresses') as FormArray;
  }

  get nameStep(): FormGroup {
    return this.organizationForm.get('nameStep') as FormGroup;
  }

  get addressStep(): FormGroup {
    return this.organizationForm.get('addressStep') as FormGroup;
  }

  get financialStep(): FormGroup {
    return this.organizationForm.get('financialStep') as FormGroup;
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
    const defaultCountry = this.organizationForm?.get('nameStep.country')?.value || '';
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
      nameStep: this.fb.group({
        displayName: ['', [Validators.required, Validators.minLength(2)]],
        type: ['', Validators.required],
        email: [email || '', [Validators.required, Validators.email]],
        country: ['', Validators.required],
        currency: ['', Validators.required]
      }),
      addressStep: this.fb.group({
        addresses: this.fb.array([])
      }),
      financialStep: this.fb.group({
        yearEndMonth: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
        yearEndDay: [null, [Validators.required, Validators.min(1), Validators.max(31)]]
      })
    });

    this.addresses.push(this.createAddressGroup());
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
        this.organizationForm.get('nameStep')?.patchValue({ currency: selectedCountry.currency });
      }
    } else {
      this.organizationForm.get('nameStep')?.patchValue({ currency: '' });
    }
  }

  onSubmit(): void {
    if (this.organizationForm.invalid) {
      this.markFormGroupTouched(this.organizationForm);
      return;
    }

    this.isSubmitting = true;

    const nameVal = this.organizationForm.get('nameStep')?.value;
    const addrVal = this.organizationForm.get('addressStep')?.value;
    const finVal = this.organizationForm.get('financialStep')?.value;

    const organizationRequest: CreateOrganizationRequest = {
      displayName: nameVal.displayName,
      type: nameVal.type,
      email: nameVal.email,
      country: nameVal.country,
      financialYear: {
        yearEndMonth: finVal.yearEndMonth,
        yearEndDay: finVal.yearEndDay
      } as FinancialYear,
      currency: nameVal.currency,
      addresses: addrVal.addresses
    };

    console.log("=========");
    console.log(organizationRequest);

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

  goToStep(index: number): void {
    if (!this.stepper) return;

    if (index < this.stepper.selectedIndex) {
      this.stepper.selectedIndex = index;
    } else if (index > this.stepper.selectedIndex) {
      const steps = this.stepper.steps.toArray();
      let allValid = true;
      for (let i = 0; i < index; i++) {
        if (steps[i]?.stepControl && !steps[i].stepControl.valid) {
          steps[i].stepControl.markAllAsTouched();
          allValid = false;
          break;
        }
      }
      if (allValid) {
        this.stepper.selectedIndex = index;
      }
    }
  }

  isStepActive(index: number): boolean {
    return this.stepper ? this.stepper.selectedIndex === index : index === 0;
  }

  isStepCompleted(index: number): boolean {
    if (!this.stepper) return false;
    const steps = this.stepper.steps.toArray();
    return index < this.stepper.selectedIndex && (steps[index]?.stepControl?.valid ?? false);
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
