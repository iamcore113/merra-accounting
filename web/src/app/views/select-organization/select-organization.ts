import { Component, OnDestroy, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Dialog } from '../../shared/components/dialog/dialog';
import { OrganizationService } from '../../shared/services/organization-service';
import { UserService } from '../../shared/services/user-service';
import { AuthService } from '../../shared/services/auth-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';
import {
  OrganizationAffiliation,
  PrincipalDetailsResponse,
  UserOrganizationAffiliation,
} from '../../shared/models/organization';
import { Config } from '../../shared/models/api_response';

@Component({
  selector: 'app-select-organization',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './select-organization.html',
  styleUrl: './select-organization.scss',
})
export class SelectOrganization implements OnInit, OnDestroy {
  private readonly organizationService = inject(OrganizationService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly dialogService = inject(DialogService, { optional: true });
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  userName = signal<string>('');
  userEmail = signal<string>('');
  organizations = signal<OrganizationAffiliation[]>([]);
  isLoading = signal<boolean>(true);
  selectingOrgId = signal<string | null>(null);
  logoUrls = signal<Record<string, string>>({});
  loadingLogoIds = signal<Set<string>>(new Set());
  private readonly loadedLogoIds = new Set<string>();

  ngOnInit(): void {
    const storedEmail = this.localStorage.getItem('user_email') || '';
    if (storedEmail) {
      this.userEmail.set(storedEmail);
      this.userName.set(storedEmail.split('@')[0]);
    }
    this.loadUserDetailsAndOrganizations();
  }

  loadUserDetailsAndOrganizations(): void {
    this.isLoading.set(true);

    this.userService.getAuthenticatedUserDetails().subscribe({
      next: (res: Config) => {
        if (res.success && 'data' in res && res.data) {
          const details = res.data as PrincipalDetailsResponse;
          if (details.email) {
            this.userEmail.set(details.email);
            this.localStorage.setItem('user_email', details.email);
          }
          const fullName = details.fullName?.trim();
          if (fullName) {
            this.userName.set(fullName);
          } else if (details.firstName) {
            this.userName.set(details.firstName);
          } else if (details.email) {
            this.userName.set(details.email.split('@')[0]);
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback to email if user details call fails
      },
    });

    this.organizationService.getUserOrganizationAffiliations().subscribe({
      next: (res: Config) => {
        if (res.success && 'data' in res && res.data) {
          const affiliationData = res.data as UserOrganizationAffiliation;
          const orgs = affiliationData.organizations || [];
          this.organizations.set(orgs);
          this.loadOrganizationLogos(orgs);
          if (orgs.length === 0) {
            const email = this.userEmail() || this.localStorage.getItem('user_email') || '';
            void this.router.navigate(
              email ? ['/account/organization-choice', email] : ['/account/organization-choice']
            );
            return;
          }
        }
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Unable to load your organizations. Please try again.',
          life: 5000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  private loadOrganizationLogos(orgs: OrganizationAffiliation[]): void {
    for (const org of orgs) {
      if (!org.hasProfileImage || this.loadedLogoIds.has(org.organizationId)) continue;
      this.loadedLogoIds.add(org.organizationId);
      this.setLogoLoading(org.organizationId, true);
      this.organizationService.getAffiliatedOrganizationProfileImage(org.organizationId).subscribe({
        next: (blob: Blob) => {
          this.logoUrls.update((m) => ({ ...m, [org.organizationId]: URL.createObjectURL(blob) }));
          this.setLogoLoading(org.organizationId, false);
        },
        error: () => this.setLogoLoading(org.organizationId, false), // fall back to initial
      });
    }
  }

  private setLogoLoading(orgId: string, loading: boolean): void {
    this.loadingLogoIds.update((set) => {
      const next = new Set(set);
      if (loading) next.add(orgId);
      else next.delete(orgId);
      return next;
    });
  }

  ngOnDestroy(): void {
    Object.values(this.logoUrls()).forEach((url) => URL.revokeObjectURL(url));
  }

  onSelectOrganization(org: OrganizationAffiliation): void {
    if (this.selectingOrgId()) {
      return;
    }

    this.selectingOrgId.set(org.organizationId);
    this.organizationService.selectOrganization(org.organizationId).subscribe({
      next: () => {
        this.selectingOrgId.set(null);
        this.router.navigate(['/main']);
      },
      error: (err) => {
        this.selectingOrgId.set(null);
        const msg = err?.error?.message || 'Failed to select organization. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
          life: 5000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  onCreateOrganization(): void {
    const email = this.userEmail() || this.localStorage.getItem('user_email') || '';
    if (email) {
      this.router.navigate(['/create/organization', email]);
    } else {
      this.router.navigate(['/no-organization']);
    }
  }

  onSignOut(): void {
    if (!this.dialogService) {
      this.authService.logout().subscribe();
      return;
    }

    const userEmail = this.userEmail() || this.localStorage.getItem('user_email') || '';
    const fullName = this.userName() || '';
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
        contextBadge:
          fullName || userEmail
            ? {
                icon: 'pi pi-user',
                label: 'Signed in account',
                value: fullName || userEmail,
                subValue: fullName && userEmail && fullName !== userEmail ? userEmail : undefined,
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

  getOrgInitial(name: string): string {
    return name && name.trim().length > 0 ? name.trim().charAt(0).toUpperCase() : 'O';
  }
}
