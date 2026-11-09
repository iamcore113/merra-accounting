import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';

import { JournalService } from '../../../shared/services/journal-service';
import { JournalResponse } from '../../../shared/models/journals';

export type JournalFilterTab = 'ALL' | 'CUSTOMER' | 'SUPPLIER';

@Component({
  selector: 'app-main-journals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TableModule,
    TooltipModule,
    SkeletonModule,
  ],
  templateUrl: './main-journals.html',
  styleUrl: './main-journals.scss',
})
export class MainJournals implements OnInit {
  private readonly journalService = inject(JournalService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  journals: JournalResponse[] = [];
  filteredJournals: JournalResponse[] = [];
  isLoading = true;
  loadError: string | null = null;

  activeTab: JournalFilterTab = 'ALL';
  searchQuery = '';

  readonly filterTabs: { id: JournalFilterTab; label: string }[] = [
    { id: 'ALL', label: 'All Entries' },
    { id: 'CUSTOMER', label: 'Customer Invoices (Sales)' },
    { id: 'SUPPLIER', label: 'Supplier Invoices (Bills)' },
  ];

  ngOnInit(): void {
    this.loadJournals();
  }

  loadJournals(): void {
    this.isLoading = true;
    this.loadError = null;
    this.journalService.getAllJournals().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.journals = res.data;
          this.applyFilters();
        } else {
          this.journals = [];
          this.filteredJournals = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err.error?.message || 'Failed to retrieve accounting journal entries.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: this.loadError || 'Error loading journals',
          life: 3000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  setFilterTab(tab: JournalFilterTab): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    const query = this.searchQuery.trim().toLowerCase();

    this.filteredJournals = this.journals.filter((j) => {
      const invType = (j.invoiceType || '').toUpperCase();
      if (this.activeTab === 'CUSTOMER' && !invType.includes('CUSTOMER')) {
        return false;
      }
      if (this.activeTab === 'SUPPLIER' && !invType.includes('SUPPLIER')) {
        return false;
      }

      if (!query) {
        return true;
      }

      const matchesHeader =
        String(j.journalNumber || '').toLowerCase().includes(query) ||
        (j.invoiceNumber || '').toLowerCase().includes(query) ||
        (j.contactName || '').toLowerCase().includes(query) ||
        (j.narration || '').toLowerCase().includes(query);

      const matchesLine = (j.journalLines || []).some(
        (line) =>
          (line.accountCode || '').toLowerCase().includes(query) ||
          (line.accountName || '').toLowerCase().includes(query) ||
          (line.description || '').toLowerCase().includes(query)
      );

      return matchesHeader || matchesLine;
    });
  }

  get totalEntriesCount(): number {
    return this.filteredJournals.length;
  }

  get totalDebitsAmount(): number {
    return this.filteredJournals.reduce((sum, j) => sum + (Number(j.totalDebit) || 0), 0);
  }

  get totalCreditsAmount(): number {
    return this.filteredJournals.reduce((sum, j) => sum + (Number(j.totalCredit) || 0), 0);
  }

  get isLedgerBalanced(): boolean {
    return Math.abs(this.totalDebitsAmount - this.totalCreditsAmount) < 0.01;
  }

  isJournalBalanced(journal: JournalResponse): boolean {
    const debit = Number(journal.totalDebit) || 0;
    const credit = Number(journal.totalCredit) || 0;
    return Math.abs(debit - credit) < 0.01;
  }

  goToInvoice(invoiceId?: string | null): void {
    if (!invoiceId) return;
    this.router.navigate(['/main/invoice', invoiceId]);
  }

  goToAccounts(): void {
    this.router.navigate(['/main/accounts']);
  }

  goToInvoices(): void {
    this.router.navigate(['/main/invoice']);
  }

  getInvoiceTypeLabel(invoiceType?: string | null): string {
    if (!invoiceType) return 'Transaction';
    return invoiceType.toUpperCase().includes('CUSTOMER')
      ? 'Customer Invoice'
      : 'Supplier Invoice';
  }

  getInvoiceTypeSeverity(invoiceType?: string | null): 'success' | 'warn' | 'info' {
    if (!invoiceType) return 'info';
    return invoiceType.toUpperCase().includes('CUSTOMER') ? 'success' : 'warn';
  }
}
