import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

export interface ContactTableRow {
  name: string;
  accountNumber: string;
  isSupplier: boolean;
  isCustomer: boolean;
}

@Component({
  selector: 'app-main-contact',
  standalone: true,
  imports: [CommonModule, TableModule, CheckboxModule, FormsModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule],
  templateUrl: './main-contact.html',
  styleUrl: './main-contact.scss',
})
export class MainContact {
  searchQuery = '';
  selectedContacts: ContactTableRow[] = [];

  readonly contacts: ContactTableRow[] = [
    {
      name: 'Acme Corporation',
      accountNumber: 'ACC-1001',
      isSupplier: true,
      isCustomer: true,
    },
    {
      name: 'Globex Industries',
      accountNumber: 'ACC-1002',
      isSupplier: false,
      isCustomer: true,
    },
    {
      name: 'Initech LLC',
      accountNumber: 'ACC-1003',
      isSupplier: true,
      isCustomer: false,
    },
    {
      name: 'Umbrella Trading Co.',
      accountNumber: 'ACC-1004',
      isSupplier: true,
      isCustomer: true,
    },
    {
      name: 'Stark Logistics',
      accountNumber: 'ACC-1005',
      isSupplier: false,
      isCustomer: false,
    },
  ];

  get filteredContacts(): ContactTableRow[] {
    if (!this.searchQuery.trim()) {
      return this.contacts;
    }
    const q = this.searchQuery.toLowerCase();
    return this.contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.accountNumber.toLowerCase().includes(q)
    );
  }
}
