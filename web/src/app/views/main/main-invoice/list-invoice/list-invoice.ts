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

export interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  contactName: string;
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

  selectedStatus = 'ALL';
  searchQuery = '';
  selectedInvoices: InvoiceItem[] = [];

  readonly allInvoices: InvoiceItem[] = [
    {
      id: 'inv-001',
      invoiceNumber: 'INV-00101',
      contactName: 'Acme Corporation',
      issueDate: '2026-10-15',
      dueDate: '2026-11-15',
      status: 'APPROVED',
      totalAmount: 1850.00,
    },
    {
      id: 'inv-002',
      invoiceNumber: 'INV-00102',
      contactName: 'Globex Industries',
      issueDate: '2026-10-20',
      dueDate: '2026-11-20',
      status: 'DRAFT',
      totalAmount: 420.50,
    },
    {
      id: 'inv-003',
      invoiceNumber: 'INV-00103',
      contactName: 'Initech LLC',
      issueDate: '2026-09-01',
      dueDate: '2026-10-01',
      status: 'PAID',
      totalAmount: 3200.00,
    },
    {
      id: 'inv-004',
      invoiceNumber: 'INV-00104',
      contactName: 'Umbrella Trading Co.',
      issueDate: '2026-10-28',
      dueDate: '2026-11-28',
      status: 'DRAFT',
      totalAmount: 950.00,
    },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['status']) {
        const s = params['status'].toUpperCase();
        if (['DRAFT', 'APPROVED', 'PAID', 'ALL'].includes(s)) {
          this.selectedStatus = s;
        }
      }
    });
  }

  get filteredInvoices(): InvoiceItem[] {
    return this.allInvoices.filter((inv) => {
      const matchStatus =
        this.selectedStatus === 'ALL' || inv.status === this.selectedStatus;
      const matchSearch =
        !this.searchQuery.trim() ||
        inv.invoiceNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        inv.contactName.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }

  setStatus(status: string): void {
    this.selectedStatus = status;
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
