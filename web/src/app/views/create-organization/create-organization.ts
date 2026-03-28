import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrganizationService } from '../../shared/services/organization-service';
import { CreateOrganizationRequest, FinancialYear, OrganizationMetaDataResponse } from '../../shared/models/organization';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Config } from '../../shared/models/api_response';

@Component({
  selector: 'app-create-organization',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './create-organization.html',
  styleUrl: './create-organization.scss',
})
export class CreateOrganization implements OnInit {
  private organizationService = inject(OrganizationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private activatedRoute = inject(ActivatedRoute);

  public organizationMetadata: OrganizationMetaDataResponse | null = null;
  organizationForm!: FormGroup;
  isSubmitting = false;
  daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  ngOnInit(): void {
    const email = this.activatedRoute.snapshot.paramMap.get('email');
    this.initializeForm(email);
    this.loadOrganizationMetadata();
  }

  private loadOrganizationMetadata(): void {
    let verifiedData: OrganizationMetaDataResponse | null = null;
    this.organizationService.getOrganizationMetadata().subscribe({
      next: (response: Config) => {
        if (response.result && 'data' in response) {
          verifiedData = (response as any).data as OrganizationMetaDataResponse;
        }
      },
      error: (error) => {
        console.error('Failed to load organization metadata:', error);
        this.snackBar.open('Failed to load organization metadata', 'Close', {
          duration: 3000
        });
      },
      complete: () => {
        this.organizationMetadata = verifiedData;
        console.log('Organization metadata loaded:', this.organizationMetadata);
      }
    });
  }

  private initializeForm(email?: string | null): void {
    this.organizationForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      type: ['', Validators.required],
      email: [email || '', [Validators.required, Validators.email]],
      country: ['', Validators.required],
      yearEndMonth: [null, Validators.required],
      yearEndDay: [null, Validators.required],
      currency: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.organizationForm.invalid) {
      this.markFormGroupTouched(this.organizationForm);
      return;
    }

    this.isSubmitting = true;

    const formValue = this.organizationForm.value;
    
    const organizationRequest: CreateOrganizationRequest = {
      displayName: formValue.displayName,
      type: formValue.type,
      email: formValue.email,
      country: formValue.country,
      financialYear: {
        yearEndMonth: formValue.yearEndMonth,
        yearEndDay: formValue.yearEndDay
      } as FinancialYear,
      currency: formValue.currency
    };

    // TODO: Get actual user ID from authentication service
    const userId = 'current-user-id';

    this.organizationService.createOrganization(organizationRequest, userId).subscribe({
      next: (response) => {
        this.snackBar.open('Organization created successfully!', 'Success', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/organizations']);
      },
      error: (error) => {
        console.error('Error creating organization:', error);
        this.snackBar.open('Failed to create organization. Please try again.', 'Error', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/organizations']);
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
