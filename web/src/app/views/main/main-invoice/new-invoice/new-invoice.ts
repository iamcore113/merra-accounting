import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatMenuModule,
    MatSnackBarModule
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
  displayedColumns: string[] = ['itemCode', 'description', 'quantity', 'price', 'account', 'taxRate', 'amount', 'actions'];
  lineItems: InvoiceLineItem[] = [];
  dataSource = new MatTableDataSource<InvoiceLineItem>(this.lineItems);

  // Totals calculations
  subTotal = 0;
  totalTax = 0;
  grandTotal = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly snackBar: MatSnackBar,
    private readonly invoiceService: InvoiceService,
    private readonly contactService: ContactService,
    private readonly router: Router
  ) {}

  goToCreateContact(event: Event): void {
    event.stopPropagation(); // Prevents select dropdown from opening
    this.router.navigate(['/main/invoice']);
  }

  ngOnInit(): void {
    // Build reactive form mapping standard Invoice entity fields
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['INV-0001', Validators.required],
      organization: ['oscorp', Validators.required],
      type: ['', Validators.required],
      contact: ['', Validators.required],
      lineAmountTypes: ['EXCLUSIVE', Validators.required],
      date: [new Date(), Validators.required],
      dueDate: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), Validators.required], // 30 days from now
      status: ['', Validators.required],
      reference: ['']
    });

    // Populate table with one default empty row
    this.addLineItem();

    // Recalculate if form settings like lineAmountTypes change
    this.invoiceForm.get('lineAmountTypes')?.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    // Fetch dynamic options from backend endpoints
    this.loadInvoiceMetadata();
    this.loadContacts();
  }

  loadInvoiceMetadata(): void {
    this.invoiceService.getInvoiceMetadata().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const metadata = res.data;
          
          // Populate Invoice Types (from metadata.invoiceTypes)
          if (metadata.invoiceTypes && metadata.invoiceTypes.length > 0) {
            this.types = metadata.invoiceTypes.map(t => ({
              code: t.id,
              name: t.name
            }));
            // Auto-select first type
            this.invoiceForm.patchValue({ type: this.types[0].code });
          }

          // Populate Statuses (from metadata.invoiceStatusCodes)
          if (metadata.invoiceStatusCodes && metadata.invoiceStatusCodes.length > 0) {
            this.statuses = metadata.invoiceStatusCodes.map(s => ({
              value: s.code,
              label: s.code.charAt(0).toUpperCase() + s.code.slice(1).toLowerCase()
            }));
            // Auto-select DRAFT status if present, otherwise first status
            const draftStatus = this.statuses.find(s => s.value === 'DRAFT');
            this.invoiceForm.patchValue({ status: draftStatus ? draftStatus.value : this.statuses[0].value });
          }

          // Populate Line Amount Types
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
        this.snackBar.open('Error loading invoice metadata.', 'Close', { duration: 3000 });
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
        this.snackBar.open('Error loading contacts.', 'Close', { duration: 3000 });
      }
    });
  }

  addLineItem(): void {
    this.lineItems.push({
      itemCode: '',
      description: '',
      quantity: 1,
      price: 0,
      account: '200',
      taxRate: 15,
      amount: 0
    });
    this.dataSource.data = [...this.lineItems];
    this.calculateTotals();
  }

  deleteLineItem(index: number): void {
    if (this.lineItems.length > 1) {
      this.lineItems.splice(index, 1);
      this.dataSource.data = [...this.lineItems];
      this.calculateTotals();
    } else {
      this.snackBar.open('Invoice must have at least one line item.', 'Close', {
        duration: 3000,
        panelClass: ['warning-snackbar']
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
      item.amount = lineTotal; // Base line amount

      if (amountType === 'EXCLUSIVE') {
        runningSubTotal += lineTotal;
        runningTaxTotal += lineTotal * ((item.taxRate || 0) / 100);
      } else if (amountType === 'INCLUSIVE') {
        // Tax is included inside the total price
        const taxFactor = (item.taxRate || 0) / (100 + (item.taxRate || 0));
        const lineTax = lineTotal * taxFactor;
        runningSubTotal += (lineTotal - lineTax);
        runningTaxTotal += lineTax;
      } else {
        // NO_TAX
        runningSubTotal += lineTotal;
        // Tax remains 0
      }
    });

    this.subTotal = runningSubTotal;
    this.totalTax = runningTaxTotal;
    
    if (amountType === 'EXCLUSIVE') {
      this.grandTotal = runningSubTotal + runningTaxTotal;
    } else if (amountType === 'INCLUSIVE') {
      this.grandTotal = runningSubTotal + runningTaxTotal;
    } else {
      this.grandTotal = runningSubTotal;
    }
  }

  saveInvoice(status: string): void {
    if (this.invoiceForm.invalid) {
      this.invoiceForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields.', 'Close', { duration: 3000 });
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
    this.snackBar.open(`Invoice successfully saved as ${status}! (UI Mode)`, 'Success', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}
