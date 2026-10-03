import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  errorCode: string = '500';
  errorMessage: string = 'Something went wrong';
  errorDescription: string = 'An unexpected error occurred. Please try again later.';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.errorCode = params['code'] || '500';
      this.errorMessage = params['message'] || 'Something went wrong';
      this.errorDescription = params['description'] || 'An unexpected error occurred. Please try again later.';
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
