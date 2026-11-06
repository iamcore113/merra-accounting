import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SplitButtonModule } from 'primeng/splitbutton';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuItem, MessageService } from 'primeng/api';
import { InvoiceService } from '../../../../shared/services/invoice-service';
import { ContactService } from '../../../../shared/services/contact-service';
import { CreateContactRequest } from '../../../../shared/models/contacts';
import { InvoicePreviewData } from '../invoice-preview/invoice-preview';

export interface InvoiceLineItem {
  itemCode: string;
  description: string;
  quantity: number;
  price: number;
  account: string;
  taxRate: number; // percentage, e.g. 15 or 0
  amount: number;  // calculated
}

export interface InvoiceContactOption {
  id: string;
  name: string;
  isCustomer: boolean;
  isSupplier: boolean;
  typeLabel: 'Customer' | 'Supplier' | 'Both' | 'None';
  typeInitials: 'CT' | 'SP' | 'BT' | '';
  displayName: string;
  accountNumber?: string;
  emailAddress?: string;
}

@Component({
  selector: 'app-new-invoice',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    DatePickerModule,
    InputTextModule,
    SelectModule,
    TableModule,
    SplitButtonModule,
    DialogModule,
    CheckboxModule
  ],
  templateUrl: './new-invoice.html',
  styleUrl: './new-invoice.scss',
})
export class NewInvoice implements OnInit {
  invoiceForm!: FormGroup;

  // New Contact Dialog
  showNewContactDialog = false;
  newContactForm!: FormGroup;
  isSubmittingContact = false;

  // Invoice Number State
  customerInvoiceExistsError: string | null = null;
  isCheckingInvoiceNumber = false;

  // Dropdown list options
  organizations = [
    { id: 'oscorp', name: 'Oscorp Industries' },
    { id: 'stark', name: 'Stark Industries' },
    { id: 'wayne', name: 'Wayne Enterprises' }
  ];

  types = [
    { code: 'CUSTOMER_INVOICE', name: 'Customer Invoice (Sales)' },
    { code: 'SUPPLIER_INVOICE', name: 'Supplier Invoice (Bills)' }
  ];

  contacts: InvoiceContactOption[] = [];

  lineAmountTypesOptions = [
    { value: 'EXCLUSIVE', label: 'Tax Exclusive' },
    { value: 'INCLUSIVE', label: 'Tax Inclusive' },
    { value: 'NO_TAX', label: 'No Tax' }
  ];

  statuses = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'AUTHORISED', label: 'Authorised' }
  ];

  accounts = [
    { code: '200', name: 'Sales (200)' },
    { code: '300', name: 'Purchases (300)' },
    { code: '400', name: 'Advertising (400)' },
    { code: '420', name: 'Office Expenses (420)' }
  ];

  taxRates = [
    { value: 15, label: 'Standard (15%)' },
    { value: 5, label: 'Reduced (5%)' },
    { value: 0, label: 'Tax Exempt (0%)' }
  ];

  // Table variables
  lineItems: InvoiceLineItem[] = [];

  // Totals calculations
  subTotal = 0;
  totalTax = 0;
  grandTotal = 0;

  // Split button items
  approveItems: MenuItem[] = [
    { label: 'Approve Only', command: () => this.saveInvoice('AUTHORISED') },
    { label: 'Approve & Email', command: () => this.saveInvoice('AUTHORISED') },
    { label: 'Approve & Print', command: () => this.saveInvoice('AUTHORISED') }
  ];

  saveItems: MenuItem[] = [
    { label: 'Save as Draft', command: () => this.saveInvoice('DRAFT') },
    { label: 'Save & Submit', command: () => this.saveInvoice('SUBMITTED') }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly messageService: MessageService,
    private readonly invoiceService: InvoiceService,
    private readonly contactService: ContactService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  openNewContactDialog(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.initContactForm();
    this.showNewContactDialog = true;
  }

  goToCreateContact(event: Event): void {
    this.openNewContactDialog(event);
  }

  onCloseNewContactDialog(): void {
    this.showNewContactDialog = false;
    this.isSubmittingContact = false;
  }

  private initContactForm(): void {
    this.newContactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      isSupplier: [false],
      isCustomer: [true],
      contactStatus: ['ACTIVE']
    });
  }

  saveNewContact(): void {
    if (this.newContactForm.invalid) {
      this.newContactForm.markAllAsTouched();
      return;
    }

    const isCustomer = !!this.newContactForm.get('isCustomer')?.value;
    const isSupplier = !!this.newContactForm.get('isSupplier')?.value;
    if (!isCustomer && !isSupplier) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Relationship Required',
        detail: 'Please select at least one relationship type (Customer, Supplier, or Both).',
        life: 3000
      });
      return;
    }

    this.isSubmittingContact = true;
    const formValue = { ...this.newContactForm.value };
    const payload: CreateContactRequest = {
      name: formValue.name?.trim(),
      contactStatus: 'ACTIVE',
      isCustomer,
      isSupplier
    };

    this.contactService.createContact(payload).subscribe({
      next: (res: any) => {
        this.isSubmittingContact = false;
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: res.message || 'Contact created successfully',
            life: 3000
          });

          const newContactId = res.data?.contactId;
          const newContactName = res.data?.contactName || payload.name;

          if (newContactId) {
            const isCust = !!payload.isCustomer;
            const isSupp = !!payload.isSupplier;
            const typeLabel: 'Customer' | 'Supplier' | 'Both' | 'None' =
              isCust && isSupp ? 'Both' : isCust ? 'Customer' : isSupp ? 'Supplier' : 'None';
            const typeInitials: 'CT' | 'SP' | 'BT' | '' =
              isCust && isSupp ? 'BT' : isCust ? 'CT' : isSupp ? 'SP' : '';
            const newEntry: InvoiceContactOption = {
              id: String(newContactId),
              name: newContactName,
              isCustomer: isCust,
              isSupplier: isSupp,
              typeLabel,
              typeInitials,
              displayName: typeInitials ? `${newContactName} (${typeInitials})` : newContactName
            };
            const existingIndex = this.contacts.findIndex(c => c.id === newEntry.id);
            if (existingIndex >= 0) {
              this.contacts[existingIndex] = newEntry;
            } else {
              this.contacts = [...this.contacts, newEntry];
            }
            this.invoiceForm.patchValue({ contact: newEntry.id });
          } else {
            this.loadContacts(payload.name);
          }

          this.showNewContactDialog = false;
          this.validateContactInvoiceTypeMatch();
          this.cdr.markForCheck();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: res.message || 'Failed to create contact',
            life: 3000
          });
        }
      },
      error: (err) => {
        this.isSubmittingContact = false;
        const msg = err.error?.message || err.message || 'Failed to create contact';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
          life: 3000
        });
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.initContactForm();

    this.invoiceForm = this.fb.group({
      invoiceNumber: [''],
      customerInvoiceSuffix: [''],
      organization: ['oscorp', Validators.required],
      type: ['', Validators.required],
      contact: ['', Validators.required],
      lineAmountTypes: ['EXCLUSIVE', Validators.required],
      date: [new Date(), Validators.required],
      dueDate: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), Validators.required],
      status: ['', Validators.required],
      reference: ['']
    });

    this.addLineItem();

    this.invoiceForm.get('lineAmountTypes')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    this.invoiceForm.get('contact')?.valueChanges.subscribe(() => {
      this.validateContactInvoiceTypeMatch();
    });

    this.invoiceForm.get('type')?.valueChanges.subscribe(() => {
      this.validateContactInvoiceTypeMatch();
      this.updateInvoiceNumberValidation();
    });

    this.invoiceForm.get('date')?.valueChanges.subscribe((newIssueDate) => {
      this.validateInvoiceDates();
      const dueDateVal = this.invoiceForm.get('dueDate')?.value;
      if (newIssueDate && dueDateVal) {
        const dIssue = new Date(newIssueDate);
        const dDue = new Date(dueDateVal);
        dIssue.setHours(0, 0, 0, 0);
        dDue.setHours(0, 0, 0, 0);
        if (dDue.getTime() < dIssue.getTime()) {
          const newDue = new Date(dIssue.getTime() + 30 * 24 * 60 * 60 * 1000);
          this.invoiceForm.get('dueDate')?.setValue(newDue, { emitEvent: false });
          this.validateInvoiceDates();
        }
      }
    });

    this.invoiceForm.get('dueDate')?.valueChanges.subscribe(() => {
      this.validateInvoiceDates();
    });

    this.validateInvoiceDates();

    this.invoiceForm.get('invoiceNumber')?.valueChanges.subscribe((val: string) => {
      if (this.isCurrentTypeCustomerInvoice) {
        if (!val) {
          if (this.invoiceForm.get('customerInvoiceSuffix')?.value) {
            this.invoiceForm.get('customerInvoiceSuffix')?.setValue('', { emitEvent: false });
          }
        } else {
          const suffix = val.replace(/^INV-?/i, '').replace(/[^0-9-]/g, '').slice(0, 9);
          if (this.invoiceForm.get('customerInvoiceSuffix')?.value !== suffix) {
            this.invoiceForm.get('customerInvoiceSuffix')?.setValue(suffix, { emitEvent: false });
          }
        }
      }
    });

    this.updateInvoiceNumberValidation();
    this.loadInvoiceMetadata();
    this.loadContacts();
  }

  loadInvoiceMetadata(): void {
    this.invoiceService.getInvoiceMetadata().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const metadata = res.data;
          
          if (metadata.invoiceTypes && metadata.invoiceTypes.length > 0) {
            this.types = metadata.invoiceTypes.map(t => ({
              code: t.id,
              name: t.name
            }));
            this.invoiceForm.patchValue({ type: this.types[0].code });
            this.validateContactInvoiceTypeMatch();
            this.updateInvoiceNumberValidation();
          }

          if (metadata.invoiceStatusCodes && metadata.invoiceStatusCodes.length > 0) {
            this.statuses = metadata.invoiceStatusCodes.map(s => ({
              value: s.code,
              label: s.code.charAt(0).toUpperCase() + s.code.slice(1).toLowerCase()
            }));
            const draftStatus = this.statuses.find(s => s.value === 'DRAFT');
            this.invoiceForm.patchValue({ status: draftStatus ? draftStatus.value : this.statuses[0].value });
          }

          if (metadata.lineAmountTypes && metadata.lineAmountTypes.length > 0) {
            this.lineAmountTypesOptions = metadata.lineAmountTypes.map(lat => ({
              value: lat.name.replace(' ', '_').toUpperCase(),
              label: lat.name
            }));
          }
        }
      },
      error: (err) => {
        console.error('Failed to load invoice metadata:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error loading invoice metadata.', life: 3000 });
      }
    });
  }

  loadContacts(selectContactName?: string): void {
    this.contactService.getAllContacts().subscribe({
      next: (res) => {
        if (res.success && 'data' in res) {
          const contactList = res.data as any[];
          if (contactList && contactList.length > 0) {
            this.contacts = contactList.map(c => {
              const isCustomer = !!c.isCustomer;
              const isSupplier = !!c.isSupplier;
              const typeLabel: 'Customer' | 'Supplier' | 'Both' | 'None' =
                isCustomer && isSupplier ? 'Both' : isCustomer ? 'Customer' : isSupplier ? 'Supplier' : 'None';
              const typeInitials: 'CT' | 'SP' | 'BT' | '' =
                isCustomer && isSupplier ? 'BT' : isCustomer ? 'CT' : isSupplier ? 'SP' : '';
              return {
                id: c.contactId,
                name: c.contactName,
                isCustomer,
                isSupplier,
                typeLabel,
                typeInitials,
                displayName: typeInitials ? `${c.contactName} (${typeInitials})` : c.contactName,
                accountNumber: c.accountNumber || undefined,
                emailAddress: c.emailAddress || undefined
              };
            });
            if (selectContactName) {
              const matched = this.contacts.find(c => c.name === selectContactName);
              if (matched) {
                this.invoiceForm.patchValue({ contact: matched.id });
              }
            }
            this.validateContactInvoiceTypeMatch();
          }
        }
      },
      error: (err) => {
        console.error('Failed to load contacts:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error loading contacts.', life: 3000 });
      }
    });
  }

  getSelectedContact(): InvoiceContactOption | undefined {
    const contactId = this.invoiceForm?.get('contact')?.value;
    return this.contacts.find(c => c.id === contactId);
  }

  getSelectedInvoiceType(): { code: string; name: string } | undefined {
    const typeCode = this.invoiceForm?.get('type')?.value;
    return this.types.find(t => t.code === typeCode);
  }

  private isCustomerInvoice(typeCodeOrName?: string): boolean {
    if (!typeCodeOrName) return false;
    const val = typeCodeOrName.toUpperCase();
    return val.includes('CUSTOMER') || val.includes('RECEIVABLE') || val.includes('SALES');
  }

  private isSupplierInvoice(typeCodeOrName?: string): boolean {
    if (!typeCodeOrName) return false;
    const val = typeCodeOrName.toUpperCase();
    return val.includes('SUPPLIER') || val.includes('PAYABLE') || val.includes('BILL');
  }

  get contactTypeMismatchError(): string | null {
    const contact = this.getSelectedContact();
    const invType = this.getSelectedInvoiceType();
    if (!contact || !invType) {
      return null;
    }

    // Contacts marked as 'Both' can be used for both Customer and Supplier invoices
    if (contact.isCustomer && contact.isSupplier) {
      return null;
    }

    const isCustType = this.isCustomerInvoice(invType.code) || this.isCustomerInvoice(invType.name);
    const isSuppType = this.isSupplierInvoice(invType.code) || this.isSupplierInvoice(invType.name);

    if (isCustType && !contact.isCustomer) {
      return `Cannot create a ${invType.name} because '${contact.name}' is only a Supplier, not a Customer.`;
    }

    if (isSuppType && !contact.isSupplier) {
      return `Cannot create a ${invType.name} because '${contact.name}' is only a Customer, not a Supplier.`;
    }

    return null;
  }

  get isCurrentTypeCustomerInvoice(): boolean {
    const invType = this.getSelectedInvoiceType();
    if (!invType) return true;
    return this.isCustomerInvoice(invType.code) || this.isCustomerInvoice(invType.name);
  }

  get isCurrentTypeSupplierInvoice(): boolean {
    const invType = this.getSelectedInvoiceType();
    if (!invType) return false;
    return this.isSupplierInvoice(invType.code) || this.isSupplierInvoice(invType.name);
  }

  get minDueDate(): Date {
    const issueDateVal = this.invoiceForm?.get('date')?.value;
    if (issueDateVal) {
      const d = new Date(issueDateVal);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  validateInvoiceDates(): void {
    const dateCtrl = this.invoiceForm?.get('date');
    const dueDateCtrl = this.invoiceForm?.get('dueDate');
    if (!dateCtrl || !dueDateCtrl) return;

    const issueDateVal = dateCtrl.value;
    const dueDateVal = dueDateCtrl.value;

    if (!issueDateVal || !dueDateVal) {
      if (dueDateCtrl.hasError('dueDateBeforeIssueDate')) {
        const errors = { ...dueDateCtrl.errors };
        delete errors['dueDateBeforeIssueDate'];
        dueDateCtrl.setErrors(Object.keys(errors).length ? errors : null);
      }
      return;
    }

    const issueDate = new Date(issueDateVal);
    const dueDate = new Date(dueDateVal);
    issueDate.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate.getTime() < issueDate.getTime()) {
      dueDateCtrl.setErrors({
        ...dueDateCtrl.errors,
        dueDateBeforeIssueDate: true
      });
    } else {
      if (dueDateCtrl.hasError('dueDateBeforeIssueDate')) {
        const errors = { ...dueDateCtrl.errors };
        delete errors['dueDateBeforeIssueDate'];
        dueDateCtrl.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    this.cdr.markForCheck();
  }

  onCustomerInvoiceSuffixInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value.replace(/^INV-?/i, '').replace(/[^0-9-]/g, '');
    if (val.length > 9) {
      val = val.slice(0, 9);
    }
    input.value = val;
    this.invoiceForm.get('customerInvoiceSuffix')?.setValue(val, { emitEvent: false });
    const fullNumber = val ? `INV-${val}` : '';
    this.invoiceForm.get('invoiceNumber')?.setValue(fullNumber, { emitEvent: false });
    this.validateCustomerInvoiceDuplication();
  }

  onSupplierInvoiceInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    if (val.length > 13) {
      val = val.slice(0, 13);
    }
    input.value = val;
    this.invoiceForm.get('invoiceNumber')?.setValue(val, { emitEvent: false });
  }

  validateCustomerInvoiceDuplication(): void {
    const suffix = this.invoiceForm.get('customerInvoiceSuffix')?.value?.trim();
    if (!suffix || suffix.length < 4) {
      this.customerInvoiceExistsError = null;
      if (this.invoiceForm.get('customerInvoiceSuffix')?.hasError('alreadyExists')) {
        const errors = { ...this.invoiceForm.get('customerInvoiceSuffix')?.errors };
        delete errors['alreadyExists'];
        this.invoiceForm.get('customerInvoiceSuffix')?.setErrors(Object.keys(errors).length ? errors : null);
      }
      return;
    }

    const fullInvoiceNumber = `INV-${suffix}`;
    if (fullInvoiceNumber.length > 13) {
      return;
    }

    this.isCheckingInvoiceNumber = true;
    this.invoiceService.checkInvoiceNumberExists(fullInvoiceNumber).subscribe({
      next: (res) => {
        this.isCheckingInvoiceNumber = false;
        if (res.data) {
          this.customerInvoiceExistsError = `Customer invoice number '${fullInvoiceNumber}' already exists for this organization`;
          this.invoiceForm.get('customerInvoiceSuffix')?.setErrors({
            ...this.invoiceForm.get('customerInvoiceSuffix')?.errors,
            alreadyExists: true
          });
        } else {
          this.customerInvoiceExistsError = null;
          if (this.invoiceForm.get('customerInvoiceSuffix')?.hasError('alreadyExists')) {
            const errors = { ...this.invoiceForm.get('customerInvoiceSuffix')?.errors };
            delete errors['alreadyExists'];
            this.invoiceForm.get('customerInvoiceSuffix')?.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isCheckingInvoiceNumber = false;
        this.customerInvoiceExistsError = null;
        this.cdr.markForCheck();
      }
    });
  }

  updateInvoiceNumberValidation(): void {
    const control = this.invoiceForm?.get('invoiceNumber');
    const suffixControl = this.invoiceForm?.get('customerInvoiceSuffix');
    if (!control || !suffixControl) return;

    if (this.isCurrentTypeSupplierInvoice) {
      this.customerInvoiceExistsError = null;
      suffixControl.clearValidators();
      suffixControl.setErrors(null);
      control.setValidators([Validators.required, Validators.maxLength(13)]);
    } else {
      control.setValidators([
        (ctrl: AbstractControl) => {
          const val = ctrl.value?.trim();
          if (!val) return null; // optional
          if (!val.toUpperCase().startsWith('INV-')) {
            return { invalidPrefix: true };
          }
          if (val.length > 13) {
            return { maxlength: true };
          }
          return null;
        }
      ]);

      suffixControl.setValidators([
        (ctrl: AbstractControl) => {
          const val = ctrl.value?.trim();
          if (!val) return null; // optional
          if (val.length > 9) {
            return { maxlength: true };
          }
          if (!/^[0-9-]+$/.test(val)) {
            return { invalidSuffix: true };
          }
          return null;
        }
      ]);
    }
    control.updateValueAndValidity();
    suffixControl.updateValueAndValidity();
    this.cdr.markForCheck();
  }

  validateContactInvoiceTypeMatch(): void {
    const error = this.contactTypeMismatchError;
    const contactControl = this.invoiceForm?.get('contact');
    const typeControl = this.invoiceForm?.get('type');

    if (error) {
      contactControl?.setErrors({ ...contactControl.errors, contactTypeMismatch: true });
      typeControl?.setErrors({ ...typeControl.errors, contactTypeMismatch: true });
    } else {
      if (contactControl?.hasError('contactTypeMismatch')) {
        const errors = { ...contactControl.errors };
        delete errors['contactTypeMismatch'];
        contactControl.setErrors(Object.keys(errors).length ? errors : null);
      }
      if (typeControl?.hasError('contactTypeMismatch')) {
        const errors = { ...typeControl.errors };
        delete errors['contactTypeMismatch'];
        typeControl.setErrors(Object.keys(errors).length ? errors : null);
      }
    }
    this.cdr.markForCheck();
  }

  addLineItem(): void {
    this.lineItems = [
      ...this.lineItems,
      {
        itemCode: '',
        description: '',
        quantity: 1,
        price: 0,
        account: '200',
        taxRate: 15,
        amount: 0
      }
    ];
    this.calculateTotals();
  }

  deleteLineItem(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems = this.lineItems.filter((_, i) => i !== index);
      this.calculateTotals();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Invoice must have at least one line item.',
        life: 3000
      });
    }
  }

  onItemChange(item: InvoiceLineItem): void {
    item.amount = (item.quantity || 0) * (item.price || 0);
    this.calculateTotals();
  }

  calculateTotals(): void {
    const amountType = this.invoiceForm.get('lineAmountTypes')?.value;
    let runningSubTotal = 0;
    let runningTaxTotal = 0;

    this.lineItems.forEach(item => {
      const lineTotal = (item.quantity || 0) * (item.price || 0);
      item.amount = lineTotal;

      if (amountType === 'EXCLUSIVE') {
        runningSubTotal += lineTotal;
        runningTaxTotal += lineTotal * ((item.taxRate || 0) / 100);
      } else if (amountType === 'INCLUSIVE') {
        const taxFactor = (item.taxRate || 0) / (100 + (item.taxRate || 0));
        const lineTax = lineTotal * taxFactor;
        runningSubTotal += (lineTotal - lineTax);
        runningTaxTotal += lineTax;
      } else {
        runningSubTotal += lineTotal;
      }
    });

    this.subTotal = runningSubTotal;
    this.totalTax = runningTaxTotal;
    this.grandTotal = runningSubTotal + (amountType === 'NO_TAX' ? 0 : runningTaxTotal);
  }

  saveInvoice(status: string): void {
    if (this.contactTypeMismatchError) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Contact / Invoice Type',
        detail: this.contactTypeMismatchError,
        life: 4000
      });
      return;
    }

    let invoiceNumberVal = this.invoiceForm.get('invoiceNumber')?.value?.trim();

    if (this.isCurrentTypeSupplierInvoice) {
      if (!invoiceNumberVal) {
        this.invoiceForm.get('invoiceNumber')?.markAsTouched();
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Invoice number is required for supplier invoices.',
          life: 3000
        });
        return;
      }
      if (invoiceNumberVal.length > 13) {
        this.invoiceForm.get('invoiceNumber')?.markAsTouched();
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Supplier invoice number cannot exceed 13 characters.',
          life: 3000
        });
        return;
      }
    } else if (this.isCurrentTypeCustomerInvoice) {
      const suffix = this.invoiceForm.get('customerInvoiceSuffix')?.value?.trim();
      if (suffix) {
        if (suffix.length > 9 || !/^[0-9-]+$/.test(suffix)) {
          this.invoiceForm.get('customerInvoiceSuffix')?.markAsTouched();
          this.messageService.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Customer invoice number cannot exceed 13 characters total (max 9 characters after INV-).',
            life: 3000
          });
          return;
        }
        invoiceNumberVal = `INV-${suffix}`;
      } else {
        invoiceNumberVal = null;
      }

      if (this.customerInvoiceExistsError) {
        this.invoiceForm.get('customerInvoiceSuffix')?.markAsTouched();
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: this.customerInvoiceExistsError,
          life: 3000
        });
        return;
      }
    }

    const dateVal = this.invoiceForm.get('date')?.value;
    const dueDateVal = this.invoiceForm.get('dueDate')?.value;
    if (dateVal && dueDateVal) {
      const dIssue = new Date(dateVal);
      const dDue = new Date(dueDateVal);
      dIssue.setHours(0, 0, 0, 0);
      dDue.setHours(0, 0, 0, 0);
      if (dDue.getTime() < dIssue.getTime()) {
        this.invoiceForm.get('dueDate')?.markAsTouched();
        this.messageService.add({
          severity: 'error',
          summary: 'Validation Error',
          detail: 'Due date cannot be earlier than issue date.',
          life: 3000
        });
        return;
      }
    }

    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill in all required fields.', life: 3000 });
      return;
    }

    const payload = {
      ...this.invoiceForm.value,
      invoiceNumber: invoiceNumberVal,
      status: status,
      subTotal: this.subTotal,
      grandTotal: this.grandTotal,
      totalTax: this.totalTax,
      lineItems: this.lineItems
    };
    delete payload.customerInvoiceSuffix;

    console.log('Saving Invoice Payload:', payload);
    const successDetail = invoiceNumberVal
      ? `Invoice ${invoiceNumberVal} successfully saved as ${status}!`
      : `Customer invoice successfully saved as ${status}! (Invoice number will be auto-generated)`;

    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: successDetail,
      life: 3000
    });
  }

  buildPreviewData(): InvoicePreviewData {
    const contact = this.getSelectedContact();
    const invType = this.getSelectedInvoiceType();
    const orgId = this.invoiceForm.get('organization')?.value;
    const org = this.organizations.find(o => o.id === orgId);

    let invoiceNumberVal = this.invoiceForm.get('invoiceNumber')?.value?.trim();
    if (this.isCurrentTypeCustomerInvoice) {
      const suffix = this.invoiceForm.get('customerInvoiceSuffix')?.value?.trim();
      if (suffix) {
        invoiceNumberVal = `INV-${suffix}`;
      } else if (!invoiceNumberVal) {
        invoiceNumberVal = 'INV-2026-DRAFT';
      }
    } else {
      if (!invoiceNumberVal) {
        invoiceNumberVal = 'SUPP-DRAFT';
      }
    }

    return {
      invoiceNumber: invoiceNumberVal,
      organizationName: org?.name || 'Oscorp Industries',
      organizationEmail: 'billing@merra.io',
      organizationPhone: '+1 (555) 019-2834',
      organizationAddress: '100 Innovation Way, Suite 400, New York, NY 10001',
      organizationTaxNumber: 'US-94829103',
      type: invType?.code || 'CUSTOMER_INVOICE',
      typeName: invType?.name || 'Customer Invoice (Sales)',
      contactName: contact?.name || 'Selected Contact',
      contactAccountNumber: contact?.accountNumber,
      contactTypeInitials: contact?.typeInitials,
      date: this.invoiceForm.get('date')?.value || new Date(),
      dueDate: this.invoiceForm.get('dueDate')?.value || new Date(),
      lineAmountTypes: this.invoiceForm.get('lineAmountTypes')?.value || 'EXCLUSIVE',
      status: this.invoiceForm.get('status')?.value || 'DRAFT',
      reference: this.invoiceForm.get('reference')?.value || '',
      currencySymbol: '$',
      lineItems: this.lineItems.map(item => ({
        item: item.itemCode || 'Service / Product',
        description: item.description || '',
        account: item.account || 'Sales (200)',
        quantity: item.quantity || 1,
        price: item.price || 0,
        taxRate: item.taxRate || 0,
        amount: item.amount || 0
      })),
      subTotal: this.subTotal,
      totalTax: this.totalTax,
      grandTotal: this.grandTotal,
      notes: 'Payment is due according to agreed terms. Please quote invoice number upon remittance.',
      bankDetails: {
        bankName: 'Silicon Valley Commercial Bank',
        accountName: org?.name || 'Oscorp Industries Global LLC',
        accountNumber: '4829-1029-4481',
        routingNumber: '021000021',
        swiftBic: 'SVCBUS33'
      }
    };
  }

  onPreview(): void {
    const previewData = this.buildPreviewData();
    this.router.navigate(['/main/invoice/preview'], {
      state: { invoiceData: previewData }
    });
  }
}
