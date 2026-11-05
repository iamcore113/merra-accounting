import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { ContactService } from '../../../../shared/services/contact-service';
import { ContactDetailResponse, UpdateContactRequest } from '../../../../shared/models/contacts';
import { Config, SuccessResponse } from '../../../../shared/models/api_response';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
    InputTextModule,
    CheckboxModule,
    SelectModule,
    DialogModule,
  ],
  templateUrl: './contact-detail.html',
  styleUrl: './contact-detail.scss',
})
export class ContactDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  contactId: string | null = null;
  contact: ContactDetailResponse | null = null;
  isLoading = true;
  loadError: string | null = null;

  // Edit Mode state
  isEditing = false;
  isSaving = false;
  editForm!: FormGroup;
  isCheckingAccountNumber = false;
  accountNumberExistsError: string | null = null;
  initialAccountNumber: string | null = null;

  // Delete state
  showDeleteDialog = false;
  isDeleting = false;

  readonly statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.contactId = this.route.snapshot.paramMap.get('id');
    if (!this.contactId) {
      this.loadError = 'Invalid contact identifier.';
      this.isLoading = false;
      return;
    }
    this.loadContactDetails(this.contactId);
  }

  private initForm(): void {
    this.editForm = this.fb.group({
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

    this.editForm.get('isCustomer')?.valueChanges.subscribe(() => {
      this.validateAccountNumberDuplication();
    });

    this.editForm.get('isSupplier')?.valueChanges.subscribe(() => {
      this.validateAccountNumberDuplication();
    });
  }

  loadContactDetails(id: string): void {
    this.isLoading = true;
    this.loadError = null;

    this.contactService.getContactById(id).subscribe({
      next: (res: SuccessResponse<ContactDetailResponse>) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.contact = res.data;
          this.populateForm(res.data);
        } else {
          this.loadError = res.message || 'Unable to load contact details.';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err.error?.message || err.message || 'Contact not found or error loading details.';
        this.cdr.markForCheck();
      },
    });
  }

  private populateForm(c: ContactDetailResponse): void {
    this.initialAccountNumber = c.accountNumber || null;
    let suffix = '';
    if (c.accountNumber) {
      const parts = c.accountNumber.split('-');
      suffix = parts.length > 1 ? parts[1] : c.accountNumber;
    }

    this.editForm.patchValue({
      name: c.name,
      accountNumberSuffix: suffix,
      isSupplier: !!c.isSupplier,
      isCustomer: !!c.isCustomer,
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      emailAddress: c.emailAddress || '',
      taxNumber: c.taxNumber || '',
      companyNumber: c.companyNumber || '',
      contactStatus: c.contactStatus || 'ACTIVE',
    });
  }

  get currentPrefix(): 'CUST' | 'SUP' | 'BOTH' {
    const isCustomer = !!this.editForm?.get('isCustomer')?.value;
    const isSupplier = !!this.editForm?.get('isSupplier')?.value;
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
    const sanitized = input.value.replace(/\D/g, '').slice(0, 4);
    this.editForm.get('accountNumberSuffix')?.setValue(sanitized, { emitEvent: false });
    this.accountNumberExistsError = null;
    this.validateAccountNumberDuplication();
  }

  validateAccountNumberDuplication(): void {
    const suffix = this.editForm.get('accountNumberSuffix')?.value?.trim();
    if (!suffix || suffix.length !== 4) {
      this.accountNumberExistsError = null;
      return;
    }

    const fullAccNum = `${this.currentPrefix}-${suffix}`;
    // If it matches the contact's existing account number, no duplicate error
    if (this.initialAccountNumber && fullAccNum.toUpperCase() === this.initialAccountNumber.toUpperCase()) {
      this.accountNumberExistsError = null;
      const errors = { ...this.editForm.get('accountNumberSuffix')?.errors };
      delete errors['alreadyExists'];
      this.editForm.get('accountNumberSuffix')?.setErrors(Object.keys(errors).length ? errors : null);
      this.cdr.markForCheck();
      return;
    }

    this.isCheckingAccountNumber = true;
    this.contactService.checkAccountNumberExists(fullAccNum).subscribe({
      next: (res) => {
        this.isCheckingAccountNumber = false;
        if (res.success && res.data) {
          if (res.data.exists) {
            this.accountNumberExistsError = `Account number ${fullAccNum} already exists for this organization.`;
            this.editForm.get('accountNumberSuffix')?.setErrors({
              ...this.editForm.get('accountNumberSuffix')?.errors,
              alreadyExists: true,
            });
            this.editForm.get('accountNumberSuffix')?.markAsTouched();
          } else {
            this.accountNumberExistsError = null;
            const errors = { ...this.editForm.get('accountNumberSuffix')?.errors };
            delete errors['alreadyExists'];
            this.editForm.get('accountNumberSuffix')?.setErrors(Object.keys(errors).length ? errors : null);
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

  startEditing(): void {
    if (this.contact) {
      this.populateForm(this.contact);
    }
    this.isEditing = true;
    this.accountNumberExistsError = null;
  }

  cancelEditing(): void {
    if (this.contact) {
      this.populateForm(this.contact);
    }
    this.isEditing = false;
    this.accountNumberExistsError = null;
  }

  saveChanges(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const isCustomer = !!this.editForm.get('isCustomer')?.value;
    const isSupplier = !!this.editForm.get('isSupplier')?.value;
    if (!isCustomer && !isSupplier) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Relationship Required',
        detail: 'Please select at least one relationship type (Customer, Supplier, or Both).',
      });
      return;
    }

    if (!this.contactId) return;

    this.isSaving = true;
    const formValue = { ...this.editForm.value };
    const suffix = formValue.accountNumberSuffix?.trim();
    const payload: UpdateContactRequest = {
      name: formValue.name,
      firstName: formValue.firstName || null,
      lastName: formValue.lastName || null,
      emailAddress: formValue.emailAddress || null,
      accountNumber: suffix ? `${this.currentPrefix}-${suffix}` : null,
      isSupplier,
      isCustomer,
      taxNumber: formValue.taxNumber || null,
      companyNumber: formValue.companyNumber || null,
      contactStatus: formValue.contactStatus || 'ACTIVE',
    };

    this.contactService.updateContact(this.contactId, payload).subscribe({
      next: (res: SuccessResponse<ContactDetailResponse>) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.contact = res.data;
          this.populateForm(res.data);
          this.isEditing = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Updated',
            detail: res.message || 'Contact details updated successfully',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: res.message || 'Failed to update contact',
          });
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Failed to update contact';
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: msg,
        });
        this.cdr.markForCheck();
      },
    });
  }

  // Delete methods
  openDeleteDialog(): void {
    this.showDeleteDialog = true;
  }

  closeDeleteDialog(): void {
    this.showDeleteDialog = false;
  }

  confirmDelete(): void {
    if (!this.contactId) return;
    this.isDeleting = true;

    this.contactService.deleteContact(this.contactId).subscribe({
      next: (res: Config) => {
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: res.message || 'Contact deleted successfully',
        });
        this.router.navigate(['/main/contacts']);
      },
      error: (err) => {
        this.isDeleting = false;
        this.showDeleteDialog = false;
        const msg = err.error?.message || err.message || 'Failed to delete contact';
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: msg,
        });
        this.cdr.markForCheck();
      },
    });
  }

  get relationshipLabel(): string {
    if (!this.contact) return '—';
    if (this.contact.isCustomer && this.contact.isSupplier) {
      return 'Customer & Supplier';
    }
    if (this.contact.isSupplier) {
      return 'Supplier';
    }
    if (this.contact.isCustomer) {
      return 'Customer';
    }
    return 'None';
  }

  get relationshipType(): 'BOTH' | 'CUSTOMER' | 'SUPPLIER' | 'NONE' {
    if (!this.contact) return 'NONE';
    if (this.contact.isCustomer && this.contact.isSupplier) return 'BOTH';
    if (this.contact.isSupplier) return 'SUPPLIER';
    if (this.contact.isCustomer) return 'CUSTOMER';
    return 'NONE';
  }

  get contactInitials(): string {
    if (!this.contact?.name) return '?';
    const parts = this.contact.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return this.contact.name.substring(0, 2).toUpperCase();
  }

  get personFullName(): string {
    if (!this.contact) return '—';
    const first = this.contact.firstName?.trim() || '';
    const last = this.contact.lastName?.trim() || '';
    const full = `${first} ${last}`.trim();
    return full || '—';
  }

  getStatusSeverity(status?: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'ARCHIVED':
        return 'secondary';
      default:
        return 'info';
    }
  }

  copyToClipboard(text?: string | null, label = 'Copied'): void {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Copied',
          detail: `${label} copied to clipboard`,
          life: 2000,
        });
      },
      () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Copy Failed',
          detail: 'Could not copy to clipboard',
          life: 2000,
        });
      }
    );
  }

  goBack(): void {
    this.router.navigate(['/main/contacts']);
  }
}
