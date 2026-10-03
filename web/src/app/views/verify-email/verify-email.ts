import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  public email: string | null = null;

  ngOnInit(): void {
    this.email = this.route.snapshot.paramMap.get('email');
  }

  onResend(): void {
    console.log('Resend verification email');
  }
}
