import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatGridListModule } from '@angular/material/grid-list';
import { OrganizationService } from '../../core/services/organization/organization.service';
import { OrganizationMetadata } from '../../core/utils/types';
import { ActivatedRoute } from '@angular/router';


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

  isDisabled = signal<boolean>(false);
  readonly userEmail: string = this.route.snapshot.params['email'] || '';
  metadata: OrganizationMetadata = {} as OrganizationMetadata;
  organizationTypes: OrganizationType[] = [] as OrganizationType[];
  private _formBuilder = inject(FormBuilder);

  ngOnInit(): void {
    this.org.getMetadata().subscribe((res) => {
      if ('data' in res) {
        this.metadata = res.data as OrganizationMetadata;
        this.organizationTypes = this.metadata.organizationTypes;
      }
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
  });

  onSubmit() {
    console.log(this.organizationForm.value);
  }
}
