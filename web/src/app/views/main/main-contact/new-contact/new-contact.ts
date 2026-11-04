import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ContactService } from '../../../../shared/services/contact-service';
import { Config } from '../../../../shared/models/api_response';

@Component({
  selector: 'app-new-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    TooltipModule,
  ],
  templateUrl: './new-contact.html',
  styleUrl: './new-contact.scss',
})
export class NewContact implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly contactService = inject(ContactService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  contactForm!: FormGroup;
  isSubmitting = false;
  isCheckingAccountNumber = false;
  accountNumberExistsError: string | null = null;

  readonly statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      accountNumberSuffix: ['', [Validators.pattern(/^\d{4}$/)]],
      isSupplier: [false],
      isCustomer: [true],
      firstName: [''],
      lastName: [''],
      emailAddress: ['', [Validators.email]],
      taxNumber: [''],
      companyNumber: [''],
      contactStatus: ['ACTIVE'],
    });

    this.contactForm.get('isCustomer')?.valueChanges.subscribe(() => {
      this.validateAccountNumberDuplication();
    });

    this.contactForm.get('isSupplier')?.valueChanges.subscribe(() => {
      this.validateAccountNumberDuplication();
    });
  }

  get currentPrefix(): 'CUST' | 'SUP' | 'BOTH' {
    const isCustomer = !!this.contactForm?.get('isCustomer')?.value;
    const isSupplier = !!this.contactForm?.get('isSupplier')?.value;
    if (isCustomer && isSupplier) {
      return 'BOTH';
    }
    if (isSupplier) {
      return 'SUP';
    }
    return 'CUST';
  }

  onAccountSuffixInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/^(CUST|SUP|BOTH)-?/i, '').replace(/\D/g, '');
    if (val.length > 4) {
      val = val.slice(0, 4);
    }
    input.value = val;
    this.contactForm.get('accountNumberSuffix')?.setValue(val, { emitEvent: false });
    this.validateAccountNumberDuplication();
  }

  validateAccountNumberDuplication(): void {
    const suffix = this.contactForm.get('accountNumberSuffix')?.value?.trim();
    if (!suffix || suffix.length !== 4) {
      this.accountNumberExistsError = null;
      if (this.contactForm.get('accountNumberSuffix')?.hasError('alreadyExists')) {
        const errors = { ...this.contactForm.get('accountNumberSuffix')?.errors };
        delete errors['alreadyExists'];
        this.contactForm.get('accountNumberSuffix')?.setErrors(Object.keys(errors).length ? errors : null);
      }
      return;
    }

    const fullAccountNumber = `${this.currentPrefix}-${suffix}`;
    this.isCheckingAccountNumber = true;
    this.contactService.checkAccountNumberExists(fullAccountNumber).subscribe({
      next: (res) => {
        this.isCheckingAccountNumber = false;
        if (res.data?.exists) {
          this.accountNumberExistsError = `Account number '${fullAccountNumber}' already exists for this organization`;
          this.contactForm.get('accountNumberSuffix')?.setErrors({
            ...this.contactForm.get('accountNumberSuffix')?.errors,
            alreadyExists: true,
          });
        } else {
          this.accountNumberExistsError = null;
          if (this.contactForm.get('accountNumberSuffix')?.hasError('alreadyExists')) {
            const errors = { ...this.contactForm.get('accountNumberSuffix')?.errors };
            delete errors['alreadyExists'];
            this.contactForm.get('accountNumberSuffix')?.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isCheckingAccountNumber = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const isCustomer = !!this.contactForm.get('isCustomer')?.value;
    const isSupplier = !!this.contactForm.get('isSupplier')?.value;
    if (!isCustomer && !isSupplier) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Relationship Required',
        detail: 'Please select at least one relationship type (Customer, Supplier, or Both).',
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = { ...this.contactForm.value };
    const suffix = formValue.accountNumberSuffix?.trim();
    const payload = {
      ...formValue,
      accountNumber: suffix ? `${this.currentPrefix}-${suffix}` : null,
    };
    delete payload.accountNumberSuffix;

    this.contactService.createContact(payload).subscribe({
      next: (res: Config) => {
        this.isSubmitting = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message || 'Contact created successfully',
          });
          this.router.navigate(['/main/contacts']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Failed to create contact',
          });
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        const msg = err.error?.message || err.message || 'Failed to create contact';
        if (
          err.status === 409 ||
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('account number')
        ) {
          this.accountNumberExistsError = msg;
          this.contactForm.get('accountNumberSuffix')?.setErrors({
            ...this.contactForm.get('accountNumberSuffix')?.errors,
            alreadyExists: true,
          });
          this.contactForm.get('accountNumberSuffix')?.markAsTouched();
        }
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
        });
        this.cdr.markForCheck();
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/main/contacts']);
  }
}
