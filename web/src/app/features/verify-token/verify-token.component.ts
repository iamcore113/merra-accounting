import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { VerifiedAccountResponse } from '../../core/utils/types';
import { LocalStorageService } from '../../core/services/localStorage/localStorage.service';

@Component({
  selector: 'app-verify-token',
  template: '',
  styles: ['']
})
export class VerifyTokenComponent implements OnInit {

  constructor(private router: Router, private route: ActivatedRoute, private http: AuthService, private localStorageService: LocalStorageService) { }

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
        this.localStorageService.setItem('temp_token', data.temporaryAccessToken);
        this.router.navigate(['account/personal/info/', data.email]);
      }
    });
  }

}
