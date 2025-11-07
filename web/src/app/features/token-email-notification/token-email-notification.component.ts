import { Component, OnInit, signal } from '@angular/core';
import { timer } from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import { AuthService } from '../../core/services/auth/auth.service';
import { LocalStorageService } from '../../core/services/localStorage/localStorage.service';
import { SimpleCardComponent } from '../../components/simple-card/simple-card.component';

@Component({
  selector: 'app-token-email-notification',
  templateUrl: './token-email-notification.component.html',
  styleUrls: ['./token-email-notification.component.css'],
  imports: [MatButtonModule, SimpleCardComponent],
})
export class TokenEmailNotificationComponent implements OnInit {

  isButtonDisabled = signal(false);
  cooldown = signal(0);
  constructor(private authService: AuthService, private localStorageService: LocalStorageService) { }

  resendEmailVerificationToken() {
    const userId = this.localStorageService.getItem('user_id') || '';
    this.authService.resendEmailVerification({userId: userId}).subscribe({
      next: (res) => {
        console.log('Resend email verification successful', res);
      },
      error: (err) => {
        console.error('Error resending email verification', err);
      },
      complete: () => {
        this.startCooldown(30);
      }
    });
  }

  private startCooldown(seconds: number) {
    this.isButtonDisabled.set(true);
    this.cooldown.set(seconds);

    const countDown$ = timer(0, 1000).subscribe(() => {
      this.cooldown.update(value => value - 1);

      if (this.cooldown() <= 0) {
        this.isButtonDisabled.set(false);
        countDown$.unsubscribe();
      }
    });
  }

  ngOnInit() {
    this.startCooldown(30);
  }


}
