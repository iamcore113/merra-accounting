import { Injectable } from '@angular/core';
import { ValidateTokenResponse } from '../models/auth';
import { TOKEN_VALIDATE_URL } from '../api/auth';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TokenCheckService {
  constructor(private http: HttpClient) {}

  validateToken(token: string): Observable<ValidateTokenResponse> {
    return this.http.post<ValidateTokenResponse>(TOKEN_VALIDATE_URL, { token });
  }
}
