import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocalStorageService } from '../../core/services/localStorage/localStorage.service';
import { OrganizationService } from '../../core/services/organization/organization.service';
import { OrganizationList, UserOrganizationResponse } from '../../core/utils/types';

interface UserDetails {
  userId: string;
  fullName: string;
  email: string;
}
@Component({
  selector: 'app-main',
  imports: [RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  userDetails: UserDetails = {} as UserDetails;
  userOrganizations: UserOrganizationResponse = {} as UserOrganizationResponse;
  userOrganizationList: OrganizationList = [];

  constructor(private localStorageService: LocalStorageService, private org: OrganizationService) { 
    this.org.getUserOrganizations().subscribe({
      next: (res: any) => {
        console.log('User Organizations Response:', res);
        this.userOrganizations = res.data as UserOrganizationResponse;
      },
      error: (err) => {
        console.error('Error fetching user organizations:', err);
      },
      complete: () => {
        this.userOrganizationList = this.userOrganizations.organizations;
        console.log('Completed fetching user organizations.');
      }
    });
  }
}
