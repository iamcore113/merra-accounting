import { Component } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';

export interface ContactTableRow {
  name: string;
  accountNumber: string;
  isSupplier: boolean;
  isCustomer: boolean;
}

@Component({
  selector: 'app-main-contact',
  imports: [MatTableModule, MatIconModule, MatCheckboxModule],
  templateUrl: './main-contact.html',
  styleUrl: './main-contact.scss',
})
export class MainContact {
  readonly titleHeaderColumns: string[] = ['tableTitle'];
  readonly displayedColumns: string[] = ['select', 'name', 'accountNumber', 'isSupplier', 'isCustomer'];
  readonly selection = new SelectionModel<ContactTableRow>(true, []);

  readonly dataSource = new MatTableDataSource<ContactTableRow>([
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
  ]);

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
}
