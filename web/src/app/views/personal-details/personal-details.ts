import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { AsyncPipe } from '@angular/common';
import { UserPersonalInformationRequest } from '../../shared/models/user';
import { UserService } from '../../shared/services/user-service';
import { Config, RestCountriesSelection, RestCountryList } from '../../shared/models/api_response';
import { OrganizationService } from '../../shared/services/organization-service';
import { UtilityService } from '../../shared/services/utility-service';

@Component({
  selector: 'app-personal-details',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    AsyncPipe,
  ],
  templateUrl: './personal-details.html',
  styleUrl: './personal-details.scss',
})
export class PersonalDetails implements OnInit {
  personalDetailsForm!: FormGroup;
  isEmailDisabled = true;
  emailFromResponse: string = '';
  public countries: RestCountriesSelection = [];
  filteredCountries: Observable<RestCountriesSelection> = new Observable<RestCountriesSelection>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private utilityService: UtilityService
  ) { }

  ngOnInit(): void {
    // Reactive forms keep validation rules in one place (here in TS),
    // so the template stays mostly focused on displaying fields + errors.
    this.personalDetailsForm = this.fb.group({
      email: [{ value: '', disabled: this.isEmailDisabled }, [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      country: ['', [Validators.required]],
    });

    // Initialize filteredCountries immediately with empty array to avoid undefined
    this.filteredCountries = this.personalDetailsForm.get('country')?.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCountries(value || ''))
    ) || new Observable<RestCountriesSelection>();

    // Pull the email from the URL path parameter, e.g. /account/personal-details/you@site.com
    // This is useful for onboarding flows where the backend redirects you with pre-known data.
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
          console.log('Countries loaded:', collect_response);
        }
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      },
      complete: () => {
        this.countries = collect_response.map(country => ({
          name: country.countryName,
          cca2: country.isoAlpha2Code,
          currency: country.code || 'N/A'
        }));
        // Trigger a new emission to update the filtered list with loaded countries
        this.personalDetailsForm.get('country')?.updateValueAndValidity();
      }
    });
  }

  enableEmailEditing(): void {
    this.isEmailDisabled = false;
    this.personalDetailsForm.get('email')?.enable();
  }

  private _filterCountries(value: string): RestCountriesSelection {
    const filterValue = value.toLowerCase();
    return this.countries.filter(country =>
      country.name.toLowerCase().includes(filterValue)
    );
  }

  onNext() {
    // Mark all controls as touched so validation errors show if the user clicks Next too early.
    this.personalDetailsForm.markAllAsTouched();
    if (this.personalDetailsForm.invalid) {
      return;
    }
    // form.getRawValue() - Includes all controls (enabled + disabled)
    const request: UserPersonalInformationRequest = this.personalDetailsForm.getRawValue();
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
        // TODO: Wire this up to your backend / next onboarding step.
        if (getEmail === this.emailFromResponse) {
          this.router.navigate(['/create/organization', getEmail]);
        } else {
          console.error('Email does not match');
        }
      }
    });
  }
}
