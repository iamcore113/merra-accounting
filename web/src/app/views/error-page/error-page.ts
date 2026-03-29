import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
})
export class ErrorPage implements OnInit {
  errorCode: string = '500';
  errorMessage: string = 'Something went wrong';
  errorDescription: string = 'An unexpected error occurred. Please try again later.';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

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
