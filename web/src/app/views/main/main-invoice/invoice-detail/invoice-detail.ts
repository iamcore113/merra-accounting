import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';

import { InvoiceService } from '../../../../shared/services/invoice-service';
import { ContactService } from '../../../../shared/services/contact-service';
import { AccountService } from '../../../../shared/services/account-service';
import { JournalService } from '../../../../shared/services/journal-service';
import { InvoiceDetailResponse, InvoiceLineItemDetail } from '../../../../shared/models/invoice';
import { JournalResponse } from '../../../../shared/models/journals';

export interface EditableLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;
  discountRate: number;
  taxRate: number;
  lineAmount: number;
  taxAmount: number;
  total: number;
}

export interface ContactOption {
  id: string;
  name: string;
  isCustomer: boolean;
  isSupplier: boolean;
  typeInitials: 'CT' | 'SP' | 'BT' | '';
  displayName: string;
}

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    TableModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    DialogModule,
  ],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.scss',
})
export class InvoiceDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly invoiceService = inject(InvoiceService);
  private readonly contactService = inject(ContactService);
  private readonly accountService = inject(AccountService);
  private readonly journalService = inject(JournalService);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  invoiceId: string | null = null;
  invoice: InvoiceDetailResponse | null = null;
  invoiceJournals: JournalResponse[] = [];
  isLoading = true;
  loadError: string | null = null;

  // Edit Mode state
  isEditing = false;
  isSaving = false;
  editForm!: FormGroup;

  // Delete state
  showDeleteDialog = false;
  isDeleting = false;

  // Status Change Dialog
  showStatusDialog = false;
  isUpdatingStatus = false;
  selectedNewStatus = '';

  // Dropdowns
  contacts: ContactOption[] = [];
  invoiceTypes: { id: string; name: string }[] = [];

  readonly lineAmountTypeOptions = [
    { label: 'Tax Exclusive', value: 'EXCLUSIVE' },
    { label: 'Tax Inclusive', value: 'INCLUSIVE' },
    { label: 'No Tax', value: 'NO_TAX' },
  ];

  readonly statusOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Authorised', value: 'AUTHORISED' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Voided', value: 'VOIDED' },
  ];

  accountOptions = [
    { label: 'Sales Revenue (400)', value: '400' },
    { label: 'Service Income (410)', value: '410' },
    { label: 'Office Expenses (500)', value: '500' },
    { label: 'Marketing & Advertising (510)', value: '510' },
    { label: 'Cost of Goods Sold (530)', value: '530' },
    { label: 'Accounts Payable (200)', value: '200' },
  ];

  // Editable Line Items
  editableLineItems: EditableLineItem[] = [];
  editSubTotal = 0;
  editTotalTax = 0;
  editGrandTotal = 0;

  ngOnInit(): void {
    this.initForm();
    this.invoiceId = this.route.snapshot.paramMap.get('id');
    if (!this.invoiceId) {
      this.loadError = 'Invalid invoice identifier.';
      this.isLoading = false;
      return;
    }
    this.loadInvoice(this.invoiceId);
    this.loadInvoiceJournals(this.invoiceId);
    this.loadContacts();
    this.loadMetadata();
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountService.getAllAccounts().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const active = res.data.filter((a) => a.status !== 'ARCHIVED');
          if (active.length > 0) {
            this.accountOptions = active.map((a) => ({
              label: `${a.accountName} (${a.code})`,
              value: a.code,
            }));
            this.cdr.markForCheck();
          }
        }
      },
      error: () => {
        // Keep fallback default accountOptions
      },
    });
  }

  loadInvoiceJournals(invoiceId: string): void {
    this.journalService.getJournalsByInvoiceId(invoiceId).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.invoiceJournals = res.data;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // Non-blocking if journal endpoint returns empty/error
      },
    });
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      invoiceType: ['', Validators.required],
      contact: ['', Validators.required],
      lineAmountType: ['EXCLUSIVE', Validators.required],
      date: [new Date(), Validators.required],
      dueDate: [new Date(), Validators.required],
      status: ['DRAFT', Validators.required],
      reference: [''],
    });

    this.editForm.get('lineAmountType')?.valueChanges.subscribe(() => {
      this.recalculateTotals();
    });

    this.editForm.get('date')?.valueChanges.subscribe((issueDateVal) => {
      this.validateDates();
      const dueDateVal = this.editForm.get('dueDate')?.value;
      if (issueDateVal && dueDateVal) {
        const dIssue = new Date(issueDateVal);
        const dDue = new Date(dueDateVal);
        dIssue.setHours(0, 0, 0, 0);
        dDue.setHours(0, 0, 0, 0);
        if (dDue.getTime() < dIssue.getTime()) {
          const newDue = new Date(dIssue.getTime() + 30 * 24 * 60 * 60 * 1000);
          this.editForm.get('dueDate')?.setValue(newDue, { emitEvent: false });
        }
      }
    });

    this.editForm.get('dueDate')?.valueChanges.subscribe(() => {
      this.validateDates();
    });
  }

  validateDates(): void {
    const dateCtrl = this.editForm.get('date');
    const dueDateCtrl = this.editForm.get('dueDate');
    if (!dateCtrl || !dueDateCtrl) return;

    const issueVal = dateCtrl.value;
    const dueVal = dueDateCtrl.value;
    if (issueVal && dueVal) {
      const dIssue = new Date(issueVal);
      const dDue = new Date(dueVal);
      dIssue.setHours(0, 0, 0, 0);
      dDue.setHours(0, 0, 0, 0);
      if (dDue.getTime() < dIssue.getTime()) {
        dueDateCtrl.setErrors({ ...dueDateCtrl.errors, dueDateBeforeIssueDate: true });
      } else {
        if (dueDateCtrl.hasError('dueDateBeforeIssueDate')) {
          const errors = { ...dueDateCtrl.errors };
          delete errors['dueDateBeforeIssueDate'];
          dueDateCtrl.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    }
  }

  get minDueDate(): Date {
    const issueVal = this.editForm.get('date')?.value;
    if (issueVal) {
      const d = new Date(issueVal);
      if (!isNaN(d.getTime())) {
        d.setHours(0, 0, 0, 0);
        return d;
      }
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  loadInvoice(id: string): void {
    this.isLoading = true;
    this.loadError = null;

    this.invoiceService.getInvoiceById(id).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.invoice = res.data;
          this.populateFormWithInvoice(this.invoice);
        } else {
          this.loadError = 'Invoice details could not be found.';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err.error?.message || 'Failed to retrieve invoice details.';
        this.cdr.markForCheck();
      },
    });
  }

  loadContacts(): void {
    this.contactService.getAllContacts().subscribe({
      next: (res) => {
        if (res.success && 'data' in res && Array.isArray(res.data)) {
          this.contacts = res.data.map((c: any) => {
            const isCust = !!c.isCustomer;
            const isSupp = !!c.isSupplier;
            const typeInitials: 'CT' | 'SP' | 'BT' | '' =
              isCust && isSupp ? 'BT' : isCust ? 'CT' : isSupp ? 'SP' : '';
            return {
              id: c.contactId,
              name: c.contactName,
              isCustomer: isCust,
              isSupplier: isSupp,
              typeInitials,
              displayName: typeInitials ? `${c.contactName} (${typeInitials})` : c.contactName,
            };
          });
        }
      },
      error: (err) => console.error('Failed to load contacts:', err),
    });
  }

  loadMetadata(): void {
    this.invoiceService.getInvoiceMetadata().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (res.data.invoiceTypes) {
            this.invoiceTypes = res.data.invoiceTypes.map((t) => ({
              id: t.id,
              name: t.name,
            }));
          }
        }
      },
      error: (err) => console.error('Failed to load invoice metadata:', err),
    });
  }

  private populateFormWithInvoice(inv: InvoiceDetailResponse): void {
    this.editForm.patchValue({
      invoiceType: this.invoiceTypes.find((t) => t.name.toUpperCase().includes(inv.type))?.id || '',
      contact: inv.contactId || '',
      lineAmountType: inv.lineAmountTypes || 'EXCLUSIVE',
      date: inv.date ? new Date(inv.date) : new Date(),
      dueDate: inv.dueDate ? new Date(inv.dueDate) : new Date(),
      status: inv.status || 'DRAFT',
      reference: inv.reference || '',
    });

    this.editableLineItems = (inv.lineItems || []).map((li: InvoiceLineItemDetail) => ({
      id: li.lineItemId,
      description: li.description || '',
      quantity: Number(li.quantity) || 1,
      unitAmount: Number(li.unitAmount) || 0,
      accountCode: li.accountCode || '400',
      discountRate: Number(li.discountRate) || 0,
      taxRate: 15,
      lineAmount: Number(li.lineAmount) || 0,
      taxAmount: Number(li.taxAmount) || 0,
      total: Number(li.total) || 0,
    }));

    if (this.editableLineItems.length === 0) {
      this.addLineItem();
    }

    this.recalculateTotals();
  }

  startEditing(): void {
    if (!this.invoice) return;
    this.populateFormWithInvoice(this.invoice);
    this.isEditing = true;
  }

  cancelEditing(): void {
    if (this.invoice) {
      this.populateFormWithInvoice(this.invoice);
    }
    this.isEditing = false;
  }

  addLineItem(): void {
    this.editableLineItems = [
      ...this.editableLineItems,
      {
        description: '',
        quantity: 1,
        unitAmount: 0,
        accountCode: '400',
        discountRate: 0,
        taxRate: 15,
        lineAmount: 0,
        taxAmount: 0,
        total: 0,
      },
    ];
    this.recalculateTotals();
  }

  deleteLineItem(index: number): void {
    if (this.editableLineItems.length <= 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'An invoice must have at least one line item.',
        life: 3000,
      });
      return;
    }
    this.editableLineItems = this.editableLineItems.filter((_, i) => i !== index);
    this.recalculateTotals();
  }

  onItemChange(item: EditableLineItem): void {
    this.recalculateTotals();
  }

  recalculateTotals(): void {
    const amountType = this.editForm?.get('lineAmountType')?.value || 'EXCLUSIVE';
    let runningSubTotal = 0;
    let runningTaxTotal = 0;

    this.editableLineItems.forEach((item) => {
      const q = Math.max(1, Number(item.quantity) || 1);
      const p = Number(item.unitAmount) || 0;
      const d = Number(item.discountRate) || 0;
      const net = d > 0 ? q * p * ((100 - d) / 100) : q * p;
      item.lineAmount = net;

      let tax = 0;
      let total = net;
      if (amountType === 'EXCLUSIVE') {
        tax = net * ((item.taxRate || 15) / 100);
        total = net + tax;
      } else if (amountType === 'INCLUSIVE') {
        const factor = (item.taxRate || 15) / (100 + (item.taxRate || 15));
        tax = net * factor;
        total = net;
      } else {
        tax = 0;
        total = net;
      }

      item.taxAmount = tax;
      item.total = total;
      runningSubTotal += net;
      runningTaxTotal += tax;
    });

    this.editSubTotal = runningSubTotal;
    this.editTotalTax = runningTaxTotal;
    this.editGrandTotal = runningSubTotal + (amountType === 'NO_TAX' ? 0 : runningTaxTotal);
  }

  saveInvoice(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields.',
        life: 3000,
      });
      return;
    }

    if (!this.invoiceId || !this.invoice) return;

    const formatDate = (d: any): string => {
      if (!d) return '';
      const dateObj = d instanceof Date ? d : new Date(d);
      if (isNaN(dateObj.getTime())) return '';
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const payload = {
      invoiceType: this.editForm.get('invoiceType')?.value || this.invoiceTypes[0]?.id,
      contact: this.editForm.get('contact')?.value || this.invoice.contactId,
      lineAmountType: this.editForm.get('lineAmountType')?.value || 'EXCLUSIVE',
      date: formatDate(this.editForm.get('date')?.value),
      dueDate: formatDate(this.editForm.get('dueDate')?.value),
      status: this.editForm.get('status')?.value || 'DRAFT',
      taxEligible: true,
      reference: this.editForm.get('reference')?.value?.trim() || '',
      invoiceNumber: this.invoice.invoiceNumber,
      lineItems: this.editableLineItems.map((item) => ({
        description: (item.description || 'Invoice Item').trim(),
        quantity: Math.max(1, Number(item.quantity) || 1),
        unitAmount: Number(item.unitAmount) || 0,
        accountCode: item.accountCode || '400',
        overrideTaxType: null,
        discountRate: Number(item.discountRate) || 0,
      })),
    };

    this.isSaving = true;
    this.invoiceService.updateInvoice(this.invoiceId, payload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.isEditing = false;
        if (res.success && res.data) {
          this.invoice = res.data;
        }
        if (this.invoiceId) {
          this.loadInvoiceJournals(this.invoiceId);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Invoice Updated',
          detail: 'Invoice changes have been saved successfully.',
          life: 3000,
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Failed to update invoice.';
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: msg,
          life: 4000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  // Quick Status Actions
  openChangeStatusDialog(): void {
    if (!this.invoice) return;
    this.selectedNewStatus = this.invoice.status;
    this.showStatusDialog = true;
  }

  applyStatusChange(newStatus?: string): void {
    const statusToApply = newStatus || this.selectedNewStatus;
    if (!this.invoiceId || !statusToApply) return;

    this.isUpdatingStatus = true;
    this.invoiceService.updateInvoiceStatus(this.invoiceId, statusToApply).subscribe({
      next: (res) => {
        this.isUpdatingStatus = false;
        this.showStatusDialog = false;
        if (this.invoice) {
          this.invoice = {
            ...this.invoice,
            status: statusToApply,
          };
        }
        if (this.invoiceId) {
          this.loadInvoiceJournals(this.invoiceId);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Invoice status changed to ${statusToApply}.`,
          life: 3000,
        });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        const msg = err.error?.message || err.message || 'Failed to change invoice status.';
        this.messageService.add({
          severity: 'error',
          summary: 'Status Update Failed',
          detail: msg,
          life: 4000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  // Delete Action
  confirmDelete(): void {
    this.showDeleteDialog = true;
  }

  executeDelete(): void {
    if (!this.invoiceId) return;
    this.isDeleting = true;
    this.invoiceService.deleteInvoice(this.invoiceId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Invoice Deleted',
          detail: 'The invoice has been successfully deleted.',
          life: 3000,
        });
        setTimeout(() => {
          this.router.navigate(['/main/invoice']);
        }, 600);
      },
      error: (err) => {
        this.isDeleting = false;
        const msg = err.error?.message || err.message || 'Failed to delete invoice.';
        this.messageService.add({
          severity: 'error',
          summary: 'Delete Failed',
          detail: msg,
          life: 4000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  // Navigation
  goToPreview(): void {
    if (!this.invoiceId) return;
    this.router.navigate(['/main/invoice/preview', this.invoiceId]);
  }

  goBack(): void {
    this.router.navigate(['/main/invoice']);
  }

  getTypeTagSeverity(type?: string): 'success' | 'warn' {
    return type?.toUpperCase().includes('CUSTOMER') ? 'success' : 'warn';
  }

  getStatusSeverity(status?: string): 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'secondary';
      case 'SUBMITTED':
        return 'warn';
      case 'APPROVED':
      case 'AUTHORISED':
        return 'info';
      case 'PAID':
        return 'success';
      case 'VOIDED':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
