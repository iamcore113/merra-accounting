import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { StepperModule } from 'primeng/stepper';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '../../shared/services/organization-service';
import { CreateOrganizationRequest, FinancialYear, OrganizationAddress, OrganizationMetaDataResponse, UserOrganizationAffiliation } from '../../shared/models/organization';
import { Config, RestCountriesSelection } from '../../shared/models/api_response';
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
    IconFieldModule,
    InputIconModule,
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
  public existingLegalNames: { label: string; value: string }[] = [];
  public legalNameMode: 'existing' | 'new' = 'new';
  organizationForm!: FormGroup;
  isSubmitting = false;

  readonly months = [
    { label: 'January (01)', value: 1 },
    { label: 'February (02)', value: 2 },
    { label: 'March (03)', value: 3 },
    { label: 'April (04)', value: 4 },
    { label: 'May (05)', value: 5 },
    { label: 'June (06)', value: 6 },
    { label: 'July (07)', value: 7 },
    { label: 'August (08)', value: 8 },
    { label: 'September (09)', value: 9 },
    { label: 'October (10)', value: 10 },
    { label: 'November (11)', value: 11 },
    { label: 'December (12)', value: 12 },
  ];

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
    this.loadExistingLegalNames();
    this.loadCountries();
  }

  private loadExistingLegalNames(): void {
    this.organizationService.getUserOrganizationAffiliations().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response && response.data) {
          const affiliationData = response.data as UserOrganizationAffiliation;
          const orgs = affiliationData.organizations || [];
          const uniqueLegalNames = Array.from(
            new Set(
              orgs
                .map(org => (org.legalName || org.organizationName || '').trim())
                .filter(name => name.length > 0)
            )
          );
          this.existingLegalNames = uniqueLegalNames.map(name => ({
            label: name,
            value: name,
          }));
          if (this.existingLegalNames.length > 0) {
            this.legalNameMode = 'existing';
            const legalCtrl = this.nameStep.get('legalName');
            if (legalCtrl && !legalCtrl.value) {
              legalCtrl.setValue(this.existingLegalNames[0].value);
            }
          } else {
            this.legalNameMode = 'new';
          }
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Failed to load existing legal names:', error);
      },
    });
  }

  setLegalNameMode(mode: 'existing' | 'new'): void {
    this.legalNameMode = mode;
    const legalCtrl = this.nameStep.get('legalName');
    if (!legalCtrl) return;
    if (mode === 'existing' && this.existingLegalNames.length > 0) {
      legalCtrl.setValue(this.existingLegalNames[0].value);
    } else {
      const displayName = (this.nameStep.get('displayName')?.value || '').trim();
      legalCtrl.setValue(displayName);
    }
    legalCtrl.markAsUntouched();
    this.cdr.detectChanges();
  }

  copyDisplayNameToLegalName(): void {
    const displayName = (this.nameStep.get('displayName')?.value || '').trim();
    if (displayName) {
      this.nameStep.get('legalName')?.setValue(displayName);
      this.nameStep.get('legalName')?.markAsDirty();
      this.cdr.detectChanges();
    }
  }

  private loadOrganizationMetadata(): void {
    this.organizationService.getOrganizationMetadata().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response && response.data) {
          this.organizationMetadata = response.data as OrganizationMetaDataResponse;
          this.cdr.detectChanges();
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
        legalName: ['', [Validators.required, Validators.minLength(3)]],
        type: ['', Validators.required],
        email: [email || '', [Validators.required, Validators.email]],
        country: ['', Validators.required],
        currency: ['', Validators.required],
      }),
      addressStep: this.fb.group({
        addresses: this.fb.array([]),
      }),
      financialStep: this.fb.group({
        yearEndMonth: [12, [Validators.required, Validators.min(1), Validators.max(12)]],
        yearEndDay: [31, [Validators.required, Validators.min(1), Validators.max(31)]],
      }),
    });

    this.addresses.push(this.createAddressGroup());

    this.nameStep.get('displayName')?.valueChanges.subscribe((val: string) => {
      const legalCtrl = this.nameStep.get('legalName');
      if (this.legalNameMode === 'new' && legalCtrl && !legalCtrl.dirty) {
        legalCtrl.setValue(val || '', { emitEvent: false });
      }
    });
  }

  private loadCountries(): void {
    this.utilityService.getCountries().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response && Array.isArray(response.data)) {
          const countryList = response.data as any[];
          this.countries = countryList
            .map(c => ({
              name: c.countryName || c.common || c.official || c.name || '',
              cca2: c.isoAlpha2Code || c.alpha2 || c.cca2 || '',
              currency: c.code || c.symbol || 'N/A',
            }))
            .filter(c => !!c.name && !!c.cca2)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
    const query = (event.query || '').toLowerCase().trim();
    if (!query) {
      this.filteredCountries = [...this.countries];
    } else {
      this.filteredCountries = this.countries.filter(c =>
        c.name && c.name.toLowerCase().includes(query)
      );
    }
    this.cdr.detectChanges();
  }

  onCountrySelect(selected: any): void {
    let countryCode = '';
    let countryName = '';

    if (typeof selected === 'string') {
      countryCode = selected;
    } else if (selected && typeof selected === 'object') {
      countryCode = selected.cca2 || selected.code || '';
      countryName = selected.name || '';
    }

    const countryObj = this.countries.find(c =>
      (countryCode && c.cca2 === countryCode) ||
      (countryName && c.name?.toLowerCase() === countryName.toLowerCase()) ||
      (typeof selected === 'string' && c.name?.toLowerCase() === selected.toLowerCase())
    );

    if (countryObj) {
      if (countryObj.currency && countryObj.currency !== 'N/A') {
        this.organizationForm.get('nameStep.currency')?.setValue(countryObj.currency);
      }
      const addressControls = this.addresses.controls;
      addressControls.forEach(control => {
        const addrCountry = control.get('country');
        if (addrCountry && (!addrCountry.value || addrCountry.pristine)) {
          addrCountry.setValue(countryObj.cca2);
        }
      });
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

    const countryVal = typeof nameVal.country === 'object' && nameVal.country !== null ? nameVal.country.cca2 : nameVal.country;

    const formattedAddresses: OrganizationAddress[] = (addrVal.addresses || []).map((addr: any) => ({
      type: addr.type,
      attentionTo: addr.attentionTo || '',
      addresses: (addr.addresses || []).filter((line: string) => !!line && line.trim() !== ''),
      city: addr.city,
      postalCode: addr.postalCode,
      country: typeof addr.country === 'object' && addr.country !== null ? addr.country.cca2 : addr.country,
    }));

    const organizationRequest: CreateOrganizationRequest = {
      displayName: nameVal.displayName,
      legalName: (nameVal.legalName || nameVal.displayName || '').trim(),
      type: nameVal.type,
      email: nameVal.email,
      country: countryVal,
      financialYear: {
        yearEndMonth: Number(finVal.yearEndMonth),
        yearEndDay: Number(finVal.yearEndDay),
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
    this.router.navigate(['/main']);
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
      lines.push(this.fb.control('', Validators.required));
    }
  }

  removeAddressLine(addressGroup: any, index: number): void {
    const lines = this.getAddressLines(addressGroup);
    if (lines.length > 1) {
      lines.removeAt(index);
    }
  }

  nextStep(): void {
    if (this.activeStep === 1) {
      this.nameStep.markAllAsTouched();
      if (this.nameStep.invalid) return;
    } else if (this.activeStep === 2) {
      this.addressStep.markAllAsTouched();
      if (this.addressStep.invalid) return;
    }
    if (this.activeStep < 3) {
      this.activeStep++;
      this.cdr.detectChanges();
    }
  }

  prevStep(): void {
    if (this.activeStep > 1) {
      this.activeStep--;
      this.cdr.detectChanges();
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
