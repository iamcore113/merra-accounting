import { Component, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-verify-email',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit {
  public email: string | null = null;
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Get the email from the url query parameters
    this.email = this.route.snapshot.paramMap.get('email');
  }

  onResend() {
    // Resend functionality will be implemented later
    console.log('Resend verification email');
  }
}
