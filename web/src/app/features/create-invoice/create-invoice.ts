import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface LineItem {
  description: string;
  quantity: number | null;
  unitAmount: number | null;
  accountCode: string;
  taxAmount: number | null;
  taxType: string;
  discountRate: number | null;
}

@Component({
  selector: 'app-create-invoice',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.css',
})
export class CreateInvoice {
  invoiceForm: FormGroup;
  
  displayedColumns: string[] = [
    'description', 
    'quantity', 
    'unitAmount', 
    'accountCode', 
    'taxAmount', 
    'taxType', 
    'discountRate'
  ];
  
  lineItems: LineItem[] = [
    { description: '', quantity: null, unitAmount: null, accountCode: '', taxAmount: null, taxType: '', discountRate: null }
  ];
  
  dataSource = new MatTableDataSource<LineItem>(this.lineItems);

  constructor(private fb: FormBuilder) {
    this.invoiceForm = this.fb.group({
      id: ['', Validators.required],
      type: ['', Validators.required],
      date: [new Date(), Validators.required],
      dueDate: ['', Validators.required],
      reference: ['']
    });
  }

  addItem() {
    this.lineItems.push({
      description: '', 
      quantity: null, 
      unitAmount: null, 
      accountCode: '', 
      taxAmount: null, 
      taxType: '', 
      discountRate: null
    });
    this.dataSource.data = this.lineItems;
  }
}