import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '../../shared/services/organization-service';
import { CreateOrganizationRequest, FinancialYear, NewOrganizationResponse, OrganizationMetaDataResponse } from '../../shared/models/organization';
import { Config, RestCountriesSelection } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import { UtilityService } from '../../shared/services/utility-service';

@Component({
  selector: 'app-create-organization',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    SelectModule,
    AutoCompleteModule,
    ButtonModule,
    StepperModule,
  ],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss',
})
export class CreateOrganization implements OnInit {
  private organizationService = inject(OrganizationService);
  private utilityService = inject(UtilityService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private activatedRoute = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  activeStep = 1;
  public organizationMetadata: OrganizationMetaDataResponse | null = null;
  public countries: RestCountriesSelection = [];
  public filteredCountries: RestCountriesSelection = [];
  organizationForm!: FormGroup;
  isSubmitting = false;

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
          verifiedData = response.data as OrganizationMetaDataResponse;
        }
      },
      error: (error) => {
        console.error('Failed to load organization metadata:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load organization metadata',
        });
      },
      complete: () => {
        this.organizationMetadata = verifiedData;
        this.cdr.detectChanges();
      },
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
      country: [defaultCountry, Validators.required],
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
        currency: ['', Validators.required],
      }),
      addressStep: this.fb.group({
        addresses: this.fb.array([]),
      }),
      financialStep: this.fb.group({
        yearEndMonth: [null, [Validators.required, Validators.min(1), Validators.max(12)]],
        yearEndDay: [null, [Validators.required, Validators.min(1), Validators.max(31)]],
      }),
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
            currency: c.symbol || 'N/A',
          }));
          this.filteredCountries = [...this.countries];
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Failed to load countries:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load countries',
        });
      },
    });
  }

  filterCountries(event: AutoCompleteCompleteEvent): void {
    const query = (event.query || '').toLowerCase();
    this.filteredCountries = this.countries.filter(c =>
      c.name.toLowerCase().includes(query)
    );
  }

  onCountrySelect(selected: any): void {
    const countryCode = typeof selected === 'object' && selected !== null ? selected.cca2 : selected;
    if (countryCode) {
      const countryObj = this.countries.find(c => c.cca2 === countryCode);
      if (countryObj && countryObj.currency !== 'N/A') {
        this.organizationForm.get('nameStep')?.patchValue({ currency: countryObj.currency });
      }
    }
    const addressControls = this.addresses.controls;
    addressControls.forEach(control => {
      const addrCountry = control.get('country');
      if (addrCountry && (!addrCountry.value || addrCountry.pristine)) {
        addrCountry.setValue(countryCode);
      }
    });
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

    const countryVal = typeof nameVal.country === 'object' && nameVal.country !== null ? nameVal.country.cca2 : nameVal.country;

    const formattedAddresses = (addrVal.addresses || []).map((addr: any) => ({
      ...addr,
      country: typeof addr.country === 'object' && addr.country !== null ? addr.country.cca2 : addr.country,
    }));

    const organizationRequest: CreateOrganizationRequest = {
      displayName: nameVal.displayName,
      type: nameVal.type,
      email: nameVal.email,
      country: countryVal,
      financialYear: {
        yearEndMonth: finVal.yearEndMonth,
        yearEndDay: finVal.yearEndDay,
      } as FinancialYear,
      currency: nameVal.currency,
      addresses: formattedAddresses,
    };

    this.organizationService.createOrganization(organizationRequest).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Error creating organization:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create organization. Please try again.',
        });
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Organization created successfully!',
        });
        this.router.navigate(['/main']);
      },
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

  nextStep(): void {
    this.activeStep++;
  }

  prevStep(): void {
    this.activeStep--;
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
