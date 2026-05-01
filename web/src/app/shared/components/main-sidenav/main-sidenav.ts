import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-sidenav',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterModule],
  templateUrl: './main-sidenav.html',
  styleUrl: './main-sidenav.scss',
})
export class MainSidenav {
  protected readonly navItems = [
    { label: 'Dashboard', route: '', icon: 'dashboard', iconBg: '#6FD1D7', iconColor: '#1A7A80' },
    { label: 'Accounts', route: '', icon: 'account_balance_wallet', iconBg: '#FF653F', iconColor: '#8C1A00' },
    { label: 'Personal Details', route: '', icon: 'badge', iconBg: '#9ED3DC', iconColor: '#1F6E78' },
    { label: 'Activity Log', route: '', icon: 'history', iconBg: '#C9BEFF', iconColor: '#4A3A8C' },
    { label: 'Settings', route: '', icon: 'settings', iconBg: '#F08D39', iconColor: '#7A3D00' },
  ];
}
