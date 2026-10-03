import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

export interface ContactTableRow {
  name: string;
  accountNumber: string;
  isSupplier: boolean;
  isCustomer: boolean;
}

@Component({
  selector: 'app-main-contact',
  standalone: true,
  imports: [CommonModule, TableModule, CheckboxModule, FormsModule],
  templateUrl: './main-contact.html',
  styleUrl: './main-contact.scss',
})
export class MainContact {
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
}
