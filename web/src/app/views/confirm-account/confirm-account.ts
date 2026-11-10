import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink],
  templateUrl: './confirm-account.html',
  styleUrl: './confirm-account.scss',
})
export class ConfirmAccount implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  email: string | null = null;

  ngOnInit(): void {
    const paramEmail = this.route.snapshot.paramMap.get('email');
    const queryEmail = this.route.snapshot.queryParamMap.get('email');
    const stateEmail = history.state?.email;

    this.email = paramEmail || queryEmail || stateEmail || null;

    if (!this.email) {
      void this.router.navigate(['/account/signup']);
    }
  }

  confirmOwnership(): void {
    if (this.email) {
      void this.router.navigate(['/account/signin'], {
        queryParams: { email: this.email },
        state: { email: this.email },
      });
    } else {
      void this.router.navigate(['/account/signin']);
    }
  }

  useDifferentEmail(): void {
    void this.router.navigate(['/account/signup']);
  }
}
