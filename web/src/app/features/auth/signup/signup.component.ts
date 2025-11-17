import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {FormsModule, ReactiveFormsModule, Validators, FormBuilder} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { AlertComponent } from '../../../components/alert/alert.component';
import { LocalStorageService } from '../../../core/services/localStorage/localStorage.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { CommonsService } from '../../../core/services/commons/commons.service';
import { CreateAccount, VerificationResponse } from '../../../core/utils/types';
import { SimpleCardComponent } from '../../../components/simple-card/simple-card.component';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  imports: [
    RouterLink,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    AlertComponent,
    SimpleCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent implements OnInit {
  errorMessage: string = '';
  serverError = signal(false);
  isButtonDisabled = signal(false);
  private _router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);
  private _commonsService = inject(CommonsService);

  constructor() {
  }

  signupForm = this._formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  googleIcon: string = '';

  onSubmit() {
    let response: VerificationResponse;
    let email: string;

    if (this.signupForm.valid) {
      this.isButtonDisabled.set(true);
      const payload: CreateAccount = {
        email: this.email?.value ?? '',
        password: this.password?.value ?? ''
      };
      this._authService.signup(payload)
      .subscribe({
        next: (res: any) => {
          response = res?.data;
          email = response.email;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err?.error?.message || 'An error occurred during signup. Please try again.';
          this.serverError.set(true);
          this.isButtonDisabled.set(false);
        },
        complete: () => {
          console.log('Signup request completed');
          console.log(response);
          this.isButtonDisabled.set(false);
          this.localStorageService.setItem('user_id', response.userId);
          this._router.navigate(['/email/verification', email]);
        }
      });
    }
  }

  ngOnInit(): void {
    this.googleIcon = this._authService.GoogleIcon;
  }

}
