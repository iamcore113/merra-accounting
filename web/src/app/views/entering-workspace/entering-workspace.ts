import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { OrganizationService } from '../../shared/services/organization-service';
import { Config } from '../../shared/models/api_response';
import { CurrentOrganizationResponse } from '../../shared/models/organization';

/**
 * Transition screen shown after sign-in when the user still has an active
 * user_workspace_state record. Tells the user which organization is being
 * entered, then redirects to /main.
 */
@Component({
  selector: 'app-entering-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entering-workspace.html',
  styleUrl: './entering-workspace.scss',
})
export class EnteringWorkspace implements OnInit, OnDestroy {
  private readonly organizationService = inject(OrganizationService);
  private readonly router = inject(Router);

  /** Minimum time the transition is displayed so it doesn't flash. */
  private static readonly MIN_DISPLAY_MS = 2200;
  private static readonly EXIT_ANIMATION_MS = 350;

  organizationName = signal<string>('');
  isLeaving = signal<boolean>(false);
  private exitTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const org$ = this.organizationService.getCurrentOrganization().pipe(shareReplay(1));

    // Reveal the organization name as soon as it loads
    org$.subscribe({ next: (res: Config) => this.applyName(res), error: () => {} });

    // Redirect once both the data and the minimum display time are done
    forkJoin([org$, timer(EnteringWorkspace.MIN_DISPLAY_MS)]).subscribe({
      next: () => this.leaveTo('/main'),
      error: () => this.leaveTo('/select-organization'),
    });
  }

  ngOnDestroy(): void {
    if (this.exitTimeout) {
      clearTimeout(this.exitTimeout);
    }
  }

  private applyName(res: Config): void {
    if (res.success && 'data' in res && res.data) {
      const org = res.data as CurrentOrganizationResponse;
      this.organizationName.set(org.names?.displayName || org.names?.legalName || '');
    }
  }

  private leaveTo(path: string): void {
    this.isLeaving.set(true);
    this.exitTimeout = setTimeout(() => void this.router.navigate([path]), EnteringWorkspace.EXIT_ANIMATION_MS);
  }
}
