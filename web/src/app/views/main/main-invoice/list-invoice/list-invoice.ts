import { Component, OnInit, inject } from '@angular/core';
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

export type InvoiceTypeFilter = 'ALL' | 'CUSTOMER' | 'SUPPLIER';

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  contactName: string;
  contactType?: 'CT' | 'SP' | 'BT';
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'VOIDED';
  totalAmount: number;
}

@Component({
  selector: 'app-list-invoice',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TableModule, ButtonModule, InputTextModule, TagModule, IconFieldModule, InputIconModule, TooltipModule],
  templateUrl: './list-invoice.html',
  styleUrl: './list-invoice.scss',
})
export class ListInvoice implements OnInit {
  private readonly route = inject(ActivatedRoute);

  selectedType: InvoiceTypeFilter = 'ALL';
  selectedStatus = 'ALL';
  searchQuery = '';
  selectedInvoices: InvoiceItem[] = [];

  readonly allInvoices: InvoiceItem[] = [
    {
      id: 'inv-001',
      invoiceNumber: 'INV-00101',
      type: 'CUSTOMER',
      contactName: 'Acme Corporation',
      contactType: 'CT',
      issueDate: '2026-10-15',
      dueDate: '2026-11-15',
      status: 'APPROVED',
      totalAmount: 1850.00,
    },
    {
      id: 'inv-002',
      invoiceNumber: 'INV-00102',
      type: 'CUSTOMER',
      contactName: 'Globex Industries',
      contactType: 'CT',
      issueDate: '2026-10-20',
      dueDate: '2026-11-20',
      status: 'DRAFT',
      totalAmount: 420.50,
    },
    {
      id: 'inv-003',
      invoiceNumber: 'INV-00103',
      type: 'CUSTOMER',
      contactName: 'Initech LLC',
      contactType: 'BT',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      status: 'PAID',
      totalAmount: 3200.00,
    },
    {
      id: 'inv-004',
      invoiceNumber: 'SUP-2026-01',
      type: 'SUPPLIER',
      contactName: 'Umbrella Trading Co.',
      contactType: 'SP',
      issueDate: '2026-10-28',
      dueDate: '2026-11-28',
      status: 'DRAFT',
      totalAmount: 950.00,
    },
    {
      id: 'inv-005',
      invoiceNumber: 'BILL-8891',
      type: 'SUPPLIER',
      contactName: 'Cyberdyne Systems',
      contactType: 'SP',
      issueDate: '2026-10-12',
      dueDate: '2026-11-12',
      status: 'APPROVED',
      totalAmount: 2450.00,
    },
    {
      id: 'inv-006',
      invoiceNumber: 'BILL-9042',
      type: 'SUPPLIER',
      contactName: 'Stark Logistics',
      contactType: 'BT',
      issueDate: '2026-10-05',
      dueDate: '2026-11-05',
      status: 'PAID',
      totalAmount: 5120.00,
    },
  ];

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
      const matchStatus =
        this.selectedStatus === 'ALL' || inv.status === this.selectedStatus;
      const matchSearch =
        !this.searchQuery.trim() ||
        inv.invoiceNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        inv.contactName.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
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
      case 'APPROVED':
        return 'info';
      case 'PAID':
        return 'success';
      default:
        return 'secondary';
    }
  }
}
