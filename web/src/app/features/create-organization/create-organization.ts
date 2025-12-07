import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { OrganizationService } from '../../core/services/organization/organization.service';
import { OrganizationMetadata } from '../../core/utils/types';

@Component({
  selector: 'app-create-organization',
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule, MatGridListModule, SimpleCardComponent],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.css',
})
export class CreateOrganization {
  isDisabled = signal<boolean>(false);
  metadata: OrganizationMetadata = {} as OrganizationMetadata;
  private _formBuilder = inject(FormBuilder);

  constructor(private org: OrganizationService) {
    console.log('Fetching organization metadata');
    this.org.getMetadata().subscribe((res) => {
      console.log('Metadata response: ');
      console.log(res);
      if ('data' in res) {
        this.metadata = res.data as OrganizationMetadata;
      }
    });
  }

  organizationForm = this._formBuilder.group({
    basicInformation: this._formBuilder.group({
      profileImage: [''],
      displayName: ['', Validators.required],
      legalName: ['', Validators.required],
      organizationType: ['', Validators.required],
      organizationDescription: [''],
    }),
    contactDetails: this._formBuilder.group({
      countryCode: ['', Validators.required],
      address: [],
      country: ['', Validators.required],
      phoneNo: [],
      email: ['', [Validators.required, Validators.email]],
      website: [''],
      externalLinks: [],
    }),
    inviteOtherUsers: this._formBuilder.group({
      usersToInvite: [''],
    }),
  });
}
