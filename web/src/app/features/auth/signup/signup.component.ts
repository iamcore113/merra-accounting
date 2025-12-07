import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {FormsModule, ReactiveFormsModule, Validators, FormBuilder} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { AlertComponent } from '../../../components/alert/alert.component';
import { LocalStorageService } from '../../../core/services/localStorage/localStorage.service';
import { AuthService } from '../../../core/services/auth/auth.service';
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
    AlertComponent,
    SimpleCardComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent implements OnInit {
  errorMessage: string = '';
  serverError = signal<boolean>(false);
  isDisabled = signal<boolean>(false);
  private _router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private _formBuilder = inject(FormBuilder);
  private _authService = inject(AuthService);

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
      this.isDisabled.set(true);
      const payload: CreateAccount = {
        email: this.email?.value ?? '',
        password: this.password?.value ?? ''
      };
      this._authService.signup(payload)
      .subscribe({
        next: (res: any) => {
          response = res?.data;
          email = response.userDetail.email;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err?.error?.message || 'An error occurred during signup. Please try again.';
          this.serverError.set(true);
          this.isDisabled.set(false);
        },
        complete: () => {
          this.isDisabled.set(false);
          this.localStorageService.setItem('user_id', response.userDetail.userId);
          this._router.navigate(['/email/verification', email]);
        }
      });
    }
  }

  ngOnInit(): void {
    this.googleIcon = this._authService.GoogleIcon;
  }

}
