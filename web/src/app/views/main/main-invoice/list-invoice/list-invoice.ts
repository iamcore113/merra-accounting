import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { InvoiceService } from '../../../../shared/services/invoice-service';
import { InvoiceListItem } from '../../../../shared/models/invoice';

export type InvoiceTypeFilter = 'ALL' | 'CUSTOMER' | 'SUPPLIER';

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  contactName: string;
  contactType?: 'CT' | 'SP' | 'BT';
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'VOIDED' | 'SUBMITTED' | 'AUTHORISED';
  totalAmount: number;
}

@Component({
  selector: 'app-list-invoice',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SkeletonModule,
  ],
  templateUrl: './list-invoice.html',
  styleUrl: './list-invoice.scss',
})
export class ListInvoice implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly invoiceService = inject(InvoiceService);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedType: InvoiceTypeFilter = 'ALL';
  selectedStatus = 'ALL';
  searchQuery = '';
  selectedInvoices: InvoiceItem[] = [];
  isLoading = true;

  allInvoices: InvoiceItem[] = [];

  readonly skeletonRows: InvoiceItem[] = Array.from({ length: 5 }, (_, i) => ({
    id: `skeleton-${i}`,
    invoiceNumber: '',
    type: 'CUSTOMER',
    contactName: '',
    issueDate: '',
    dueDate: '',
    status: 'DRAFT',
    totalAmount: 0,
  }));

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['type']) {
        const t = params['type'].toUpperCase();
        if (['CUSTOMER', 'SUPPLIER', 'ALL'].includes(t)) {
          this.selectedType = t as InvoiceTypeFilter;
        }
      }
      if (params['status']) {
        const s = params['status'].toUpperCase();
        if (['DRAFT', 'APPROVED', 'PAID', 'ALL'].includes(s)) {
          this.selectedStatus = s;
        }
      }
    });

    this.loadInvoices();
  }

  loadInvoices(): void {
    this.isLoading = true;
    this.invoiceService.getAllInvoices().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.allInvoices = res.data.map((item: InvoiceListItem) => ({
            id: item.id,
            invoiceNumber: item.invoiceNumber,
            type: item.type,
            contactName: item.contactName,
            contactType: item.contactType,
            issueDate: item.issueDate,
            dueDate: item.dueDate,
            status: item.status,
            totalAmount: Number(item.totalAmount) || 0,
          }));
        } else {
          this.allInvoices = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load invoices:', err);
        this.allInvoices = [];
        this.cdr.markForCheck();
      }
    });
  }

  get allCount(): number {
    return this.allInvoices.length;
  }

  get customerCount(): number {
    return this.allInvoices.filter((inv) => inv.type === 'CUSTOMER').length;
  }

  get supplierCount(): number {
    return this.allInvoices.filter((inv) => inv.type === 'SUPPLIER').length;
  }

  get filteredInvoices(): InvoiceItem[] {
    return this.allInvoices.filter((inv) => {
      const matchType =
        this.selectedType === 'ALL' || inv.type === this.selectedType;

      let matchStatus = true;
      if (this.selectedStatus !== 'ALL') {
        if (this.selectedStatus === 'APPROVED') {
          matchStatus = inv.status === 'APPROVED' || inv.status === 'AUTHORISED';
        } else {
          matchStatus = inv.status === this.selectedStatus;
        }
      }

      const matchSearch =
        !this.searchQuery.trim() ||
        inv.invoiceNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        inv.contactName.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }

  get tableData(): InvoiceItem[] {
    return this.isLoading ? this.skeletonRows : this.filteredInvoices;
  }

  setType(type: InvoiceTypeFilter): void {
    this.selectedType = type;
  }

  setStatus(status: string): void {
    this.selectedStatus = status;
  }

  getTypeTagSeverity(type: 'CUSTOMER' | 'SUPPLIER'): 'success' | 'warn' {
    return type === 'CUSTOMER' ? 'success' : 'warn';
  }

  getTypeLabel(type: 'CUSTOMER' | 'SUPPLIER'): string {
    return type === 'CUSTOMER' ? 'Customer' : 'Supplier';
  }

  getStatusSeverity(status: string): 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
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
