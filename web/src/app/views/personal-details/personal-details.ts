import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { UserPersonalInformationRequest } from '../../shared/models/user';
import { UserService } from '../../shared/services/user-service';

@Component({
  selector: 'app-personal-details',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './personal-details.html',
  styleUrl: './personal-details.scss',
})
export class PersonalDetails implements OnInit {
  personalDetailsForm: FormGroup;
  isEmailDisabled = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {
    // Reactive forms keep validation rules in one place (here in TS),
    // so the template stays mostly focused on displaying fields + errors.
    this.personalDetailsForm = this.fb.group({
      email: [{ value: '', disabled: this.isEmailDisabled }, [Validators.required, Validators.email]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      country: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    // Pull the email from the URL path parameter, e.g. /account/personal-details/you@site.com
    // This is useful for onboarding flows where the backend redirects you with pre-known data.
    this.route.paramMap.subscribe(params => {
      const email = params.get('email');
      if (email) {
        this.personalDetailsForm.patchValue({ email });
      }
    });
  }

  enableEmailEditing(): void {
    this.isEmailDisabled = false;
    this.personalDetailsForm.get('email')?.enable();
  }

  onNext() {
    // Mark all controls as touched so validation errors show if the user clicks Next too early.
    this.personalDetailsForm.markAllAsTouched();
    if (this.personalDetailsForm.invalid) {
      return;
    }
    const request: UserPersonalInformationRequest = this.personalDetailsForm.value;
    this.userService.personalInformation(request).subscribe({
      next: (response) => {
        console.log('Personal details:', response);
      },
      error: (error) => {
        console.error('Error updating personal details:', error);
      },
      complete: () => {
        console.log('Personal details update completed');
        // TODO: Wire this up to your backend / next onboarding step.
        console.log('Personal details:', this.personalDetailsForm.value);
      }
    });
  }
}
