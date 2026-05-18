import { ChangeDetectorRef, Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SessionExpiredDialogData {
  message: string;
}

@Component({
  selector: 'app-session-expired-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './session-expired-dialog.html',
  styleUrl: './session-expired-dialog.scss',
})
export class SessionExpiredDialog implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly dialogRef = inject(MatDialogRef<SessionExpiredDialog>);
  private readonly cdr = inject(ChangeDetectorRef);

  protected countdown = 10;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: SessionExpiredDialogData) {}

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
