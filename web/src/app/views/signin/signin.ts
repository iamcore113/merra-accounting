import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {LoginRequest, SigninResponse} from '../../shared/models/auth';
import { AuthService } from '../../shared/services/auth-service';
import { Config } from '../../shared/models/api_response';
import { LocalStorageService } from '../../shared/services/local-storage-service';
@Component({
  selector: 'app-signin',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin implements OnInit {
  signinForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private router: Router
  ) {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const message = params['message'];
      if (message) {
        this.errorMessage = message;
      }
    });
  }

  onSubmit() {
    if (this.signinForm.valid) {
      let verifiedData: SigninResponse;
      const req: LoginRequest = this.signinForm.value;
      this.authService.signin(req).subscribe({
        next: (response: Config) => {
          if (response.result && 'data' in response) {
            verifiedData = (response as any).data as SigninResponse;
          }
        },
        error: (error) => {
          console.error('Signin failed', error);
        },
        complete: () => {
          this.localStorage.setItem('access_token', verifiedData.tokens.accessToken);
          this.localStorage.setItem('refresh_token', verifiedData.tokens.refreshToken);
          const isComplete = verifiedData.accountStatus.isComplete;
          const getEmail = verifiedData.userdetails.email;
          if (!isComplete) {
            this.router.navigate(['/personal-details/', getEmail]);
          }
        }
      });
    }
  }
}
