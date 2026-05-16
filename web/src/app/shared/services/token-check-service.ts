import { Injectable } from '@angular/core';
import { ValidateTokenResponse } from '../models/auth';
import { TOKEN_VALIDATE_URL } from '../api/auth';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TokenCheckService {
  constructor(private http: HttpClient) {}

  validateToken(token: string): Observable<boolean> {
    return this.http.post<ValidateTokenResponse>(TOKEN_VALIDATE_URL, { token }).pipe(
      map(response => response.isValid)
    );
  }
}
