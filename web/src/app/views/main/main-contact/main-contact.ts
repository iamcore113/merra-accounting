import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ContactService } from '../../../shared/services/contact-service';
import { ContactsByOrganizationResponse } from '../../../shared/models/contacts';
import { Config } from '../../../shared/models/api_response';

export interface ContactTableRow {
  id: string;
  accountNumber: string;
  name: string;
  emailAddress: string;
  isSupplier: boolean;
  isCustomer: boolean;
  status: string;
  isTenant?: boolean;
  counterPartyId?: string | null;
  counterpartyKey?: string | null;
}

@Component({
  selector: 'app-main-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    CheckboxModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    SkeletonModule,
    TooltipModule,
  ],
  templateUrl: './main-contact.html',
  styleUrl: './main-contact.scss',
})
export class MainContact implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  selectedContacts: ContactTableRow[] = [];
  contacts: ContactTableRow[] = [];
  isLoading = true;

  readonly skeletonRows: ContactTableRow[] = Array.from({ length: 5 }, (_, i) => ({
    id: `skeleton-${i}`,
    accountNumber: '',
    name: '',
    emailAddress: '',
    isSupplier: false,
    isCustomer: false,
    status: '',
    isTenant: false,
  }));

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    this.isLoading = true;
    this.contactService.getAllContacts().subscribe({
      next: (res: Config) => {
        this.isLoading = false;
        if (res.success && 'data' in res && Array.isArray(res.data)) {
          this.contacts = (res.data as ContactsByOrganizationResponse[]).map((c) => ({
            id: c.contactId,
            accountNumber: c.accountNumber || '',
            name: c.contactName,
            emailAddress: c.emailAddress || '',
            isSupplier: !!c.isSupplier,
            isCustomer: !!c.isCustomer,
            status: c.status || 'ACTIVE',
            isTenant: !!c.isTenant,
            counterPartyId: c.counterPartyId || null,
            counterpartyKey: c.counterpartyKey || null,
          }));
        } else {
          this.contacts = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        this.contacts = [];
        console.error('Failed to load contacts:', err.error?.message || err.message || err);
        this.cdr.markForCheck();
      },
    });
  }

  get filteredContacts(): ContactTableRow[] {
    if (!this.searchQuery.trim()) {
      return this.contacts;
    }
    const q = this.searchQuery.toLowerCase();
    return this.contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.accountNumber && c.accountNumber.toLowerCase().includes(q)) ||
        (c.emailAddress && c.emailAddress.toLowerCase().includes(q))
    );
  }

  get tableData(): ContactTableRow[] {
    return this.isLoading ? this.skeletonRows : this.filteredContacts;
  }

  getStatusSeverity(status: string): 'secondary' | 'info' | 'success' | 'warn' | 'danger' | 'contrast' {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'ARCHIVED':
        return 'secondary';
      case 'GDPRREQUEST':
        return 'warn';
      default:
        return 'info';
    }
  }
}
