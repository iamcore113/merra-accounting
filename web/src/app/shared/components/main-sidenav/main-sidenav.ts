import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { RouterModule } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthService } from '../../services/auth-service';
import { UserService } from '../../services/user-service';
import { LocalStorageService } from '../../services/local-storage-service';
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
export class MainSidenav implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly dialogService = inject(DialogService);
  private readonly userService = inject(UserService, { optional: true });
  private readonly localStorage = inject(LocalStorageService, { optional: true });

  @Input() isOpen = true;
  @Input() isMobile = false;
  @Output() readonly isOpenChange = new EventEmitter<boolean>();

  get isProfileUnverified(): boolean {
    return this.userService?.isAccountUnverified() ?? false;
  }

  ngOnInit(): void {
    if (this.localStorage?.getItem('access_token') && this.userService) {
      this.userService.getAuthenticatedUserDetails().subscribe({
        error: () => {},
      });
    }
  }

  protected readonly mainNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/main', icon: 'pi pi-th-large', exact: true },
    { label: 'Invoices', route: '/main/invoice', icon: 'pi pi-receipt', exact: false },
    { label: 'Contacts', route: '/main/contacts', icon: 'pi pi-users', exact: false },
    { label: 'Chart of Accounts', route: '/main/accounts', icon: 'pi pi-list', exact: false },
    { label: 'Journals', route: '/main/journals', icon: 'pi pi-book', exact: false },
    { label: 'Organization', route: '/main/organization', icon: 'pi pi-building', exact: false },
    { label: 'Profile', route: '/main/profile', icon: 'pi pi-user', exact: false },
  ];

  toggleSidenav(): void {
    this.isOpen = !this.isOpen;
    this.isOpenChange.emit(this.isOpen);
  }

  onLogout(): void {
    const userEmail = this.localStorage?.getItem('user_email') || '';
    const ref = this.dialogService.open(Dialog, {
      header: 'Sign Out of MERRA',
      width: '440px',
      modal: true,
      dismissableMask: true,
      data: {
        variant: 'signout',
        subtitle: 'Session Security',
        title: 'Ready to sign out?',
        messages: [
          'Are you sure you want to end your current MERRA Accounting session on this browser?',
        ],
        contextBadge: userEmail
          ? {
              icon: 'pi pi-user',
              label: 'Signed in account',
              value: userEmail,
            }
          : undefined,
        confirmLabel: 'Sign Out',
        cancelLabel: 'Stay Signed In',
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
