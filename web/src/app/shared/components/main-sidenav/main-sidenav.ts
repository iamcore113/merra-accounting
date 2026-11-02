import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
  exact?: boolean;
}

@Component({
  selector: 'app-main-sidenav',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, RouterModule],
  templateUrl: './main-sidenav.html',
  styleUrl: './main-sidenav.scss',
})
export class MainSidenav {
  @Input() isOpen = true;
  @Input() isMobile = false;
  @Output() readonly isOpenChange = new EventEmitter<boolean>();

  protected readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/main', icon: 'pi pi-th-large', exact: true },
    { label: 'Invoices', route: '/main/invoice', icon: 'pi pi-receipt', exact: false },
    { label: 'Contacts', route: '/main/contacts', icon: 'pi pi-users', exact: false },
    { label: 'Organization', route: '/main/organization', icon: 'pi pi-building', exact: false },
    { label: 'Profile', route: '/main/profile', icon: 'pi pi-user', exact: false },
  ];

  toggleSidenav(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }
}
