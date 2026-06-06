import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { BaseService } from '../../shared/services/base-service';

@Component({
  selector: 'app-landing-page',
  imports: [MatButtonModule, MatIconModule, RouterLink],
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
