import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-create-organization',
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule, MatInputModule, SimpleCardComponent],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.css',
})
export class CreateOrganization {
  isDisabled = signal<boolean>(false);
  private _formBuilder = inject(FormBuilder);

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
