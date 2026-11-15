import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * Shown when a user opens a password reset link that is past its 24 hour lifetime.
 */
@Component({
  selector: 'app-link-expired',
  standalone: true,
  imports: [RouterLink, ButtonModule],
  templateUrl: './link-expired.html',
  styleUrl: './link-expired.scss',
})
export class LinkExpired {
  private readonly router = inject(Router);

  requestNewLink(): void {
    void this.router.navigate(['/account/forgot-password']);
  }
}
