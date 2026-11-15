import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LocalStorageService } from '../../shared/services/local-storage-service';

@Component({
  selector: 'app-organization-choice',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './organization-choice.html',
  styleUrl: './organization-choice.scss',
})
export class OrganizationChoice implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly localStorage = inject(LocalStorageService);

  email = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const paramEmail = params.get('email');
      this.email = paramEmail || this.localStorage.getItem('user_email') || '';
    });
  }

  onCreateOrganization(): void {
    if (this.email) {
      void this.router.navigate(['/create/organization', this.email]);
    } else {
      void this.router.navigate(['/select-organization']);
    }
  }

  onEnterInvitationToken(): void {
    if (this.email) {
      void this.router.navigate(['/account/enter-invitation', this.email]);
    } else {
      void this.router.navigate(['/account/enter-invitation']);
    }
  }
}
