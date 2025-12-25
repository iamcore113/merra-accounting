import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { OrganizationService } from '../../core/services/organization/organization.service';
import { OrganizationMetadata, CountriesList } from '../../core/utils/types';
import { ActivatedRoute } from '@angular/router';
import { CommonsService } from '../../core/services/commons/commons.service';


interface OrganizationType {
  id: string;
  name: string;
}
@Component({
  selector: 'app-create-organization',
  imports: [
    MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatInputModule,
    MatGridListModule, SimpleCardComponent,
    FormsModule, ReactiveFormsModule],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.css',
})
export class CreateOrganization implements OnInit {
  private route = inject(ActivatedRoute);
  private org = inject(OrganizationService);
  private commons = inject(CommonsService);

  isDisabled = signal<boolean>(false);
  readonly userEmail: string = this.route.snapshot.params['email'] || '';
  public countries: CountriesList[] = [];
  metadata: OrganizationMetadata = {} as OrganizationMetadata;
  organizationTypes: OrganizationType[] = [] as OrganizationType[];
  private _formBuilder = inject(FormBuilder);

  ngOnInit(): void {
    this.commons.getCountries().subscribe((res: any) => {
        this.countries = res.map((country: any) => ({
          name: country.name.common,
          cca2: country.cca2,
          currency: country.currencies ? Object.keys(country.currencies)[0] : '',
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
    });
    this.org.getMetadata().subscribe((res) => {
      if ('data' in res) {
        this.metadata = res.data as OrganizationMetadata;
        this.organizationTypes = this.metadata.organizationTypes;
      }
    });

    // 1. Subscribe to changes in country
    this.organizationForm.get('country')?.valueChanges.subscribe((value) => {
      
      // 2. Logic to transform value into an object or specific string
      const getCurrencyObj = this.countries.find(country => country.cca2 === value);
      const currency = getCurrencyObj ? getCurrencyObj.currency : '';

      // 3. Emit the value to currency
      this.organizationForm.patchValue({
        currency: currency
      });
    });
  }

  organizationForm = this._formBuilder.group({
    name: ['', Validators.required],
    email: [this.userEmail, [Validators.required, Validators.email]],
    type: ['', Validators.required],
    description: [''],
    country: ['', Validators.required],
    currency: ['', Validators.required],
    contactNo: [''],
    yearEndDay: ['', Validators.required],
    yearEndMonth: ['', Validators.required],
  });

  onSubmit() {
    const intputValues = this.organizationForm.value;
    const financialYear = {
      yearEndDay: Number(intputValues.yearEndDay),
      yearEndMonth: Number(intputValues.yearEndMonth),
    };
    const formValue = {
      displayName: intputValues.name || '',
      email: intputValues.email || '',
      type: intputValues.type || '',
      country: intputValues.country || '',
      currency: intputValues.currency || '',
      financialYear: financialYear,
    };
    console.log(this.organizationForm.value);
  }
}
