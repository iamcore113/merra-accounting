import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { VerifiedAccountResponse } from '../../core/utils/types';

@Component({
  selector: 'app-verify-token',
  template: '',
  styles: ['']
})
export class VerifyTokenComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute, private http: AuthService) { }

  ngOnInit() {
    let data: VerifiedAccountResponse;
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.http.verifyEmail(token).subscribe({
      next: (res: any) => {
        console.log(res);
        data = res.data as VerifiedAccountResponse;
      },
      error: (err) => {
        console.error(err);
      },
      complete: () => {
        this.router.navigate(['account/personal/info/', data.email]);
      }
    });
  }

}
