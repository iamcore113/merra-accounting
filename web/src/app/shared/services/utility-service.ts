import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Config } from '../models/api_response';
import { HttpClient, HttpContext } from '@angular/common/http';
import { COUNTRIES_URL } from '../api/utilities';
import { IS_AUTHENTICATED } from '../context/auth.token';

@Injectable({
  providedIn: 'root',
})
export class UtilityService {
  private http = inject(HttpClient);
  private countries_endpoint: string = COUNTRIES_URL;

  getCountries(): Observable<Config> {
    return this.http.get<Config>(this.countries_endpoint, {
      context: new HttpContext().set(IS_AUTHENTICATED, false)
    });
  }
}
