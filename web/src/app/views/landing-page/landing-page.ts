import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Router, RouterLink } from '@angular/router';
import { BaseService } from '../../shared/services/base-service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  private readonly baseService = inject(BaseService);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();

  constructor() {
    this.baseService.getHealth().subscribe({
      next: (status) => {
        console.log('System health check status:', status);
        if (status?.status !== 'UP') {
          this.router.navigate(['/offline']);
        }
      },
      error: (err) => {
        console.error('System health check failed:', err);
        this.router.navigate(['/offline']);
      },
    });
  }
}
