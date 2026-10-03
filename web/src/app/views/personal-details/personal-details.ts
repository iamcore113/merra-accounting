import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UserPersonalInformationRequest } from '../../shared/models/user';
import { UserService } from '../../shared/services/user-service';
import { Config, RestCountriesSelection, RestCountryList } from '../../shared/models/api_response';
import { UtilityService } from '../../shared/services/utility-service';

@Component({
  selector: 'app-personal-details',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    InputTextModule,
    AutoCompleteModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './personal-details.html',
  styleUrl: './personal-details.scss',
})
export class PersonalDetails implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private utilityService = inject(UtilityService);

  personalDetailsForm!: FormGroup;
  isEmailDisabled = true;
  emailFromResponse: string = '';
  public countries: RestCountriesSelection = [];
  filteredCountries: RestCountriesSelection = [];

  ngOnInit(): void {
    this.personalDetailsForm = this.fb.group({
      email: [{ value: '', disabled: this.isEmailDisabled }, [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      country: ['', [Validators.required]],
    });

    this.route.paramMap.subscribe(params => {
      const email = params.get('email');
      if (email) {
        this.personalDetailsForm.patchValue({ email });
      }
    });

    let collect_response: RestCountryList;
    this.utilityService.getCountries().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          collect_response = response.data as RestCountryList;
        }
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      },
      complete: () => {
        this.countries = collect_response.map(country => ({
          name: country.countryName,
          cca2: country.isoAlpha2Code,
          currency: country.code || 'N/A',
        }));
      },
    });
  }

  filterCountries(event: AutoCompleteCompleteEvent): void {
    const query = (event.query || '').toLowerCase();
    this.filteredCountries = this.countries.filter(c =>
      c.name.toLowerCase().includes(query)
    );
  }

  enableEmailEditing(): void {
    this.isEmailDisabled = false;
    this.personalDetailsForm.get('email')?.enable();
  }

  onNext() {
    this.personalDetailsForm.markAllAsTouched();
    if (this.personalDetailsForm.invalid) {
      return;
    }
    const rawVal = this.personalDetailsForm.getRawValue();
    // In case country is selected as an object from p-autocomplete
    const countryVal = typeof rawVal.country === 'object' && rawVal.country !== null ? rawVal.country.cca2 : rawVal.country;

    const request: UserPersonalInformationRequest = {
      ...rawVal,
      country: countryVal,
    };
    const getEmail: string = request.email;
    this.userService.personalInformation(request).subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          const verifiedData = (response as any).data as UserPersonalInformationRequest;
          this.emailFromResponse = verifiedData.email;
        }
      },
      error: (error) => {
        console.error('Error updating personal details:', error);
      },
      complete: () => {
        if (getEmail === this.emailFromResponse) {
          this.router.navigate(['/create/organization', getEmail]);
        } else {
          console.error('Email does not match');
        }
      },
    });
  }
}
