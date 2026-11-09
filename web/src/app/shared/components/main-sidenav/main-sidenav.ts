import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthService } from '../../services/auth-service';
import { Dialog } from '../dialog/dialog';

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
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);

  @Input() isOpen = true;
  @Input() isMobile = false;
  @Output() readonly isOpenChange = new EventEmitter<boolean>();

  protected readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/main', icon: 'pi pi-th-large', exact: true },
    { label: 'Invoices', route: '/main/invoice', icon: 'pi pi-receipt', exact: false },
    { label: 'Contacts', route: '/main/contacts', icon: 'pi pi-users', exact: false },
    { label: 'Network Key', route: '/main/network-key', icon: 'pi pi-key', exact: false },
    { label: 'Organization', route: '/main/organization', icon: 'pi pi-building', exact: false },
    { label: 'Profile', route: '/main/profile', icon: 'pi pi-user', exact: false },
  ];

  toggleSidenav(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }

  onLogout(): void {
    const ref = this.dialogService.open(Dialog, {
      header: 'Confirm Sign Out',
      width: '420px',
      modal: true,
      data: {
        title: 'Sign Out',
        messages: ['Are you sure you want to sign out of your account?'],
        confirmLabel: 'Sign Out',
        cancelLabel: 'Cancel',
        confirmColor: 'warn',
        icon: 'pi pi-sign-out',
      },
    });

    if (ref) {
      ref.onClose.subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.authService.logout().subscribe();
        }
      });
    }
  }
}
