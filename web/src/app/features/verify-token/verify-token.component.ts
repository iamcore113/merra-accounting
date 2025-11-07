import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { EmailVerificationSuccess } from '../../core/utils/types';

@Component({
  selector: 'app-verify-token',
  template: '',
  styles: ['']
})
export class VerifyTokenComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute, private http: AuthService) { }

  ngOnInit() {
    let data: EmailVerificationSuccess;
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.http.verifyEmail(token).subscribe({
      next: (res: any) => {
        data = res.data as EmailVerificationSuccess;
      },
      error: (err) => {
        console.error(err);
        this.router.navigate(['/']);
      },
      complete: () => {
        this.router.navigate(['account/personal/info/', data.accountId]);
      }
    });
  }

}
