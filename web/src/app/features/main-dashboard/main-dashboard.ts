import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-dashboard',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatMenuModule],
  templateUrl: './main-dashboard.html',
  styleUrl: './main-dashboard.css',
})
export class MainDashboard {
  displayedColumns: string[] = ['date', 'description', 'category', 'amount', 'status'];
  transactions = [
    { date: 'Oct 24', description: 'Tech Solutions Inc.', category: 'Service Revenue', amount: 4500.00, status: 'Completed', isPositive: true },
    { date: 'Oct 23', description: 'Office Supplies Co.', category: 'Office Expenses', amount: 245.00, status: 'Completed', isPositive: false },
    { date: 'Oct 22', description: 'Client Payment', category: 'Service Revenue', amount: 1200.00, status: 'Pending', isPositive: true },
    { date: 'Oct 21', description: 'Server Hosting', category: 'Infrastructure', amount: 150.00, status: 'Completed', isPositive: false },
  ];
}
