import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../../shared/services/auth-service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
  isSubmitting = signal(false);
  emailSent = signal(false);
  sentTo = signal('');
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const email = history.state?.email;
    if (email) {
      this.forgotForm.patchValue({ email });
    }
  }

  onSubmit(): void {
    if (this.forgotForm.invalid || this.isSubmitting()) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const email: string = this.forgotForm.value.email.trim();

    this.authService
      .forgotPassword({ email })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.sentTo.set(email);
          this.emailSent.set(true);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.message || 'Unable to send the reset link right now. Please try again.'
          );
        },
      });
  }

  backToSignin(): void {
    void this.router.navigate(['/account/signin'], { state: { email: this.sentTo() || this.forgotForm.value.email } });
  }
}
