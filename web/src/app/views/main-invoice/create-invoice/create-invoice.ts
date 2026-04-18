import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ContactService } from '../../../shared/services/contact-service';
import { ContactsByOrganizationResponse } from '../../../shared/models/contacts';
import { Config } from '../../../shared/models/api_response';
import { CreateInvoiceRequest, LineItems } from '../../../shared/models/organization';

@Component({
  selector: 'app-create-invoice',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.scss',
})
export class CreateInvoice implements OnInit {
  private contactService = inject(ContactService);
  private fb = inject(FormBuilder);

  public contactSelection: ContactsByOrganizationResponse[] = [];
  public submittedInvoice: CreateInvoiceRequest | null = null;

  readonly invoiceTypeOptions = ['ACCREC', 'ACCPAY'];
  readonly lineAmountTypeOptions = ['EXCLUSIVE', 'INCLUSIVE', 'NO_TAX'];
  readonly statusOptions = ['DRAFT', 'SUBMITTED', 'AUTHORISED'];

  readonly invoiceForm = this.fb.group({
    invoiceType: ['', Validators.required],
    contact: ['', Validators.required],
    lineAmountType: ['', [Validators.required, Validators.pattern(/^[A-Z](?:[A-Z]|_[A-Z])*$/)]],
    date: [null as Date | null],
    dueDate: [null as Date | null, Validators.required],
    status: ['DRAFT'],
    taxEligible: [false, Validators.required],
    reference: [''],
    lineItems: this.fb.array([this.createLineItemGroup()]),
  });

  ngOnInit(): void {
    let contacts: ContactsByOrganizationResponse[] = [];
    this.contactService.getAllContacts().subscribe({
      next: (response: Config) => {
        if (response.success && 'data' in response) {
          contacts = (response as any).data as ContactsByOrganizationResponse[];
        }
      },
      error: (error) => {
        console.error('Error fetching contacts:', error);
      },
      complete: () => {
        this.contactSelection = contacts;
      }
    });
  }

  get lineItems(): FormArray<FormGroup> {
    return this.invoiceForm.get('lineItems') as FormArray<FormGroup>;
  }

  addLineItem(): void {
    this.lineItems.push(this.createLineItemGroup());
  }

  removeLineItem(index: number): void {
    if (this.lineItems.length === 1) {
      return;
    }

    this.lineItems.removeAt(index);
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid || this.lineItems.length === 0) {
      this.invoiceForm.markAllAsTouched();
      return;
    }

    this.submittedInvoice = this.buildInvoiceRequest();
  }

  trackLineItem(index: number): number {
    return index;
  }

  private buildInvoiceRequest(): CreateInvoiceRequest {
    const rawValue = this.invoiceForm.getRawValue();
    const lineItems = (rawValue.lineItems ?? []) as Array<Record<string, unknown>>;

    return {
      invoiceType: rawValue.invoiceType ?? '',
      contact: rawValue.contact ?? '',
      lineAmountType: rawValue.lineAmountType ?? '',
      lineItems: lineItems.map((item) => ({
        description: String(item['description'] ?? ''),
        quantity: Number(item['quantity'] ?? 0),
        unitAmount: Number(item['unitAmount'] ?? 0),
        accountCode: String(item['accountCode'] ?? ''),
        overrideTaxType: String(item['overrideTaxType'] ?? ''),
        discountRate: Number(item['discountRate'] ?? 0),
      })) as LineItems[],
      date: this.formatDate(rawValue.date),
      dueDate: this.formatDate(rawValue.dueDate),
      status: rawValue.status ?? '',
      taxEligible: Boolean(rawValue.taxEligible),
      reference: rawValue.reference ?? '',
    };
  }

  private createLineItemGroup(): FormGroup {
    return this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitAmount: [0, [Validators.required, Validators.min(0)]],
      accountCode: ['', Validators.required],
      overrideTaxType: [''],
      discountRate: [0, [Validators.min(0), Validators.max(100)]],
    });
  }

  private formatDate(value: Date | string | null): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString().slice(0, 10);
  }
}
