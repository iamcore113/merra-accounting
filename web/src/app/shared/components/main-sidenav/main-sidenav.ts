import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-sidenav',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterLink],
  templateUrl: './main-sidenav.html',
  styleUrl: './main-sidenav.scss',
})
export class MainSidenav {
  navItems = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      gradientClass: 'dashboard-gradient-bg',
    },
    {
      label: 'Organization',
      icon: 'business',
      route: '/organization',
      gradientClass: 'business-gradient-bg',
    },
    {
      label: 'Accounts',
      icon: 'account_balance',
      route: '/accounts',
      gradientClass: 'accounts-gradient-bg',
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/settings',
      gradientClass: 'settings-gradient-bg',
    },
  ];

  detailsItems = [
    {
      label: 'Details',
      icon: 'account_circle',
      route: '/profile/details',
      gradientClass: 'personal-gradient-bg',
    },
    {
      label: 'Activity Log',
      icon: 'account_circle',
      route: '/profile/activity',
      gradientClass: 'personal-gradient-bg',
    },
  ];
}
