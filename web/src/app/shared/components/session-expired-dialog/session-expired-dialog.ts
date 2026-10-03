import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

export interface SessionExpiredDialogData {
  message: string;
}

@Component({
  selector: 'app-session-expired-dialog',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './session-expired-dialog.html',
  styleUrl: './session-expired-dialog.scss',
})
export class SessionExpiredDialog implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly dialogRef = inject(DynamicDialogRef);
  private readonly config = inject(DynamicDialogConfig);
  private readonly cdr = inject(ChangeDetectorRef);

  public readonly data: SessionExpiredDialogData = this.config.data ?? { message: 'Your session has expired.' };
  protected countdown = 10;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.countdown--;
      this.cdr.markForCheck();
      if (this.countdown <= 0) {
        this.redirectToSignIn();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
    }
  }

  protected redirectToSignIn(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.dialogRef.close();
    this.router.navigate(['/account/signin']);
  }
}
