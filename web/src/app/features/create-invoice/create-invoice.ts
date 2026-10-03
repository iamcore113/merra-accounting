import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';

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
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule
  ],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.css',
})
export class CreateInvoice {
  invoiceForm: FormGroup;
  
  lineItems: LineItem[] = [
    { description: '', quantity: null, unitAmount: null, accountCode: '', taxAmount: null, taxType: '', discountRate: null }
  ];

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
    this.lineItems = [
      ...this.lineItems,
      {
        description: '', 
        quantity: null, 
        unitAmount: null, 
        accountCode: '', 
        taxAmount: null, 
        taxType: '', 
        discountRate: null
      }
    ];
  }
}