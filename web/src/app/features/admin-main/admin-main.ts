import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { OrganizationService } from '../../core/services/organization/organization.service';

@Component({
  selector: 'app-admin-main',
  imports: [RouterOutlet],
  templateUrl: './admin-main.html',
  styleUrl: './admin-main.css'
})
export class AdminMain implements OnInit {
  private organizationService = inject(OrganizationService);

  ngOnInit(): void {
    this.organizationService.getTestOrganization().subscribe({
      next: (data) => {
        console.log('Test Organization Data:', data);
      },
      error: (error) => {
        console.error('Error fetching test organization data:', error);
      }
    });
  }

}
