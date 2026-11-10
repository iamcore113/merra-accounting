import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { OrganizationService } from '../../../shared/services/organization-service';
import { UserService } from '../../../shared/services/user-service';
import { LocalStorageService } from '../../../shared/services/local-storage-service';
import { CurrentOrganizationResponse, PrincipalDetailsResponse } from '../../../shared/models/organization';
import { Config } from '../../../shared/models/api_response';

@Component({
  selector: 'app-main-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TooltipModule],
  templateUrl: './main-home.html',
  styleUrl: './main-home.scss',
})
export class MainHome implements OnInit {
  private readonly organizationService = inject(OrganizationService);
  private readonly userService = inject(UserService);
  private readonly localStorage = inject(LocalStorageService);
  private readonly router = inject(Router);

  userName = '';
  userEmail = '';
  orgName = 'Your Organization';
  orgStatus = 'ACTIVE';
  orgCurrency = 'USD';
  financialYearEnd = '';
  isLoading = true;

  private monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  ngOnInit(): void {
    this.userEmail = this.localStorage.getItem('user_email') || '';
    this.loadUserData();
    this.loadOrganizationData();
  }

  private loadUserData(): void {
    this.userService.getAuthenticatedUserDetails().subscribe({
      next: (res: Config) => {
        if (res.success && 'data' in res) {
          const user = res.data as PrincipalDetailsResponse;
          if (user.email) {
            this.userEmail = user.email;
            this.localStorage.setItem('user_email', user.email);
          }
          this.userName = user.fullName || user.email?.split('@')[0] || '';
        }
      },
      error: () => {
        // Fallback remains empty
      }
    });
  }

  onCreateAnotherOrganization(): void {
    const email = this.userEmail || this.localStorage.getItem('user_email') || '';
    if (email) {
      this.router.navigate(['/create/organization', email]);
    } else {
      this.router.navigate(['/select-organization']);
    }
  }

  private loadOrganizationData(): void {
    this.isLoading = true;
    this.organizationService.getCurrentOrganization().subscribe({
      next: (res: Config) => {
        if (res.success && 'data' in res) {
          const org = res.data as CurrentOrganizationResponse;
          this.orgName = org.names?.displayName || org.names?.legalName || 'Your Organization';
          this.orgStatus = org.status === 'ACTIVE_ACCOUNT' ? 'ACTIVE' : org.status || 'ACTIVE';
          this.orgCurrency = org.address?.currency || 'USD';

          if (org.financialYear?.yearEndMonth && org.financialYear?.yearEndDay) {
            const monthIdx = parseInt(org.financialYear.yearEndMonth, 10) - 1;
            const monthStr = this.monthAbbreviations[monthIdx] || org.financialYear.yearEndMonth;
            this.financialYearEnd = `${monthStr} ${org.financialYear.yearEndDay}`;
          } else {
            this.financialYearEnd = 'Dec 31';
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
