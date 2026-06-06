import { Component, inject, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseService } from '../../shared/services/base-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-offline-page',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './offline-page.html',
  styleUrl: './offline-page.scss',
})
export class OfflinePage implements OnDestroy {
  private readonly baseService = inject(BaseService);
  private readonly router = inject(Router);

  public isChecking = false;
  public countdown = 10;
  private intervalId: any;

  constructor() {
    this.startCountdown();
  }

  private startCountdown() {
    this.clearInterval();
    this.countdown = 10;
    this.intervalId = setInterval(() => {
      if (this.countdown > 1) {
        this.countdown--;
      } else {
        this.checkConnection();
      }
    }, 1000);
  }

  private clearInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  public checkConnection() {
    if (this.isChecking) return;
    this.isChecking = true;
    this.clearInterval();

    this.baseService.getHealth().subscribe({
      next: (status) => {
        this.isChecking = false;
        if (status?.status === 'UP') {
          // Redirect back to home/landing page if server is back online
          this.router.navigate(['/']);
        } else {
          this.startCountdown();
        }
      },
      error: () => {
        this.isChecking = false;
        this.startCountdown();
      }
    });
  }

  ngOnDestroy() {
    this.clearInterval();
  }
}
