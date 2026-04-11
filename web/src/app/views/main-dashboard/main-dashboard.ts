import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface SummaryCard {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  status: 'positive' | 'neutral' | 'warning' | 'negative';
}

@Component({
  selector: 'app-main-dashboard',
  imports: [MatCardModule, MatIconModule, CommonModule],
  templateUrl: './main-dashboard.html',
  styleUrl: './main-dashboard.scss',
})
export class MainDashboard {
  summaryCards: SummaryCard[] = [
    {
      label: 'Total Revenue',
      value: '$0.00',
      icon: 'trending_up',
      trend: '+0%',
      status: 'neutral',
    },
    {
      label: 'Outstanding Invoices',
      value: '0',
      icon: 'receipt_long',
      trend: '0 overdue',
      status: 'neutral',
    },
    {
      label: 'My Organizations',
      value: '0',
      icon: 'business',
      trend: '0 new',
      status: 'neutral',
    },
    {
      label: 'Pending Approvals',
      value: '0',
      icon: 'pending_actions',
      trend: 'In progress',
      status: 'neutral',
    },
  ];
}
