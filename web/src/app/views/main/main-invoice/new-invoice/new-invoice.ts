import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem, MessageService } from 'primeng/api';
import { InvoiceService } from '../../../../shared/services/invoice-service';
import { ContactService } from '../../../../shared/services/contact-service';

export interface InvoiceLineItem {
  itemCode: string;
  description: string;
  quantity: number;
  price: number;
  account: string;
  taxRate: number; // percentage, e.g. 15 or 0
  amount: number;  // calculated
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
    SplitButtonModule
  ],
  templateUrl: './new-invoice.html',
  styleUrl: './new-invoice.scss',
})
export class NewInvoice implements OnInit {
  invoiceForm!: FormGroup;

  // Dropdown list options
  organizations = [
    { id: 'oscorp', name: 'Oscorp Industries' },
    { id: 'stark', name: 'Stark Industries' },
    { id: 'wayne', name: 'Wayne Enterprises' }
  ];

  types = [
    { code: 'ACCOUNTS_RECEIVABLE', name: 'Accounts Receivable (Sales)' },
    { code: 'ACCOUNTS_PAYABLE', name: 'Accounts Payable (Bills)' }
  ];

  contacts: any[] = [];

  lineAmountTypesOptions = [
    { value: 'EXCLUSIVE', label: 'Tax Exclusive' },
    { value: 'INCLUSIVE', label: 'Tax Inclusive' },
    { value: 'NO_TAX', label: 'No Tax' }
  ];

  statuses = [
    { value: 'DRAFT', label: 'Draft' },
    { value: 'SUBMITTED', label: 'Submitted' },
    { value: 'APPROVED', label: 'Approved' }
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
    { label: 'Approve Only', command: () => this.saveInvoice('APPROVED') },
    { label: 'Approve & Email', command: () => this.saveInvoice('APPROVED') },
    { label: 'Approve & Print', command: () => this.saveInvoice('APPROVED') }
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
    private readonly router: Router
  ) {}

  goToCreateContact(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/main/invoice']);
  }

  ngOnInit(): void {
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['INV-0001', Validators.required],
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

  loadContacts(): void {
    this.contactService.getAllContacts().subscribe({
      next: (res) => {
        if (res.success && 'data' in res) {
          const contactList = res.data as any[];
          if (contactList && contactList.length > 0) {
            this.contacts = contactList.map(c => ({
              id: c.contactId,
              name: c.contactName
            }));
          }
        }
      },
      error: (err) => {
        console.error('Failed to load contacts:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error loading contacts.', life: 3000 });
      }
    });
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
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill in all required fields.', life: 3000 });
      return;
    }

    const payload = {
      ...this.invoiceForm.value,
      status: status,
      subTotal: this.subTotal,
      grandTotal: this.grandTotal,
      totalTax: this.totalTax,
      lineItems: this.lineItems
    };

    console.log('Saving Invoice Payload:', payload);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: `Invoice successfully saved as ${status}! (UI Mode)`,
      life: 3000
    });
  }
}
