import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  contacts = [
    { id: 'c1', name: 'Bruce Wayne' },
    { id: 'c2', name: 'Peter Parker' },
    { id: 'c3', name: 'Tony Stark' },
    { id: 'c4', name: 'Norman Osborn' }
  ];

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
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Build reactive form mapping standard Invoice entity fields
    this.invoiceForm = this.fb.group({
      invoiceNumber: ['INV-0001', Validators.required],
      organization: ['oscorp', Validators.required],
      type: ['ACCOUNTS_RECEIVABLE', Validators.required],
      contact: ['', Validators.required],
      lineAmountTypes: ['EXCLUSIVE', Validators.required],
      date: [new Date(), Validators.required],
      dueDate: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), Validators.required], // 30 days from now
      status: ['DRAFT', Validators.required],
      reference: ['']
    });

    // Populate table with one default empty row
    this.addLineItem();

    // Recalculate if form settings like lineAmountTypes change
    this.invoiceForm.get('lineAmountTypes')?.valueChanges.subscribe(() => {
      this.calculateTotals();
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
