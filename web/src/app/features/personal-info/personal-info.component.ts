import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth/auth.service';
import { FillUserPersonalInformation } from '../../core/utils/types';

interface Country {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-personal-info',
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.css'],
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatInputModule,
    SimpleCardComponent,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
})
export class PersonalInfoComponent implements OnInit {
  private _formBuilder = inject(FormBuilder);

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private authService: AuthService) {
    this.activatedRoute.params.subscribe((params) => {
      this.userEmail.set(params['email']);
    });
  }
  private userEmail = signal<string>('');
  personalInfoForm = this._formBuilder.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    country: ['', Validators.required],
  });

  get firstName() {
    return this.personalInfoForm.get('firstName');
  }

  get lastName() {
    return this.personalInfoForm.get('lastName');
  }

  get country() {
    return this.personalInfoForm.get('country');
  }

  onSubmit() {
    if (this.personalInfoForm.valid) {
      const personalInfoVal: FillUserPersonalInformation = {
        email: this.userEmail(),
        firstName: this.firstName?.value ?? '',
        lastName: this.lastName?.value ?? '',
        country: this.country?.value ?? '',
      };
      this.authService.userPersonalInformation(personalInfoVal).subscribe({
        next: (res: any) => {
          console.log('Personal information filled successfully:', res);
        },
        error: (err: any) => {
          console.error('Error filling personal information:', err);
        },
        complete: () => {
        }
      });
    }
  }

  countries: Country[] = [
    {value: 'phil', viewValue: 'Philippines'},
    {value: 'usa', viewValue: 'USA'},
    {value: 'thailand', viewValue: 'Thailand'},
    {value: 'australia', viewValue: 'Australia'},
    {value: 'canada', viewValue: 'Canada'},
    {value: 'germany', viewValue: 'Germany'},
    {value: 'france', viewValue: 'France'},
    {value: 'japan', viewValue: 'Japan'},
    {value: 'singapore', viewValue: 'Singapore'},
  ];

  ngOnInit() {
  }

  public handleSkip() {
    this.router.navigate(['/account/organization/create', this.userEmail()]);
  }

}
