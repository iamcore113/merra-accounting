import { Injectable, inject } from '@angular/core';
import { ActuatorHealthResponse } from '../models/api_response';
import { HttpClient, HttpContext } from '@angular/common/http';
import { HEALTH_URL } from '../api/base';
import { Observable } from 'rxjs';
import { IS_AUTHENTICATED } from '../context/auth.token';

@Injectable({
  providedIn: 'root',
})
export class BaseService {
  private readonly http = inject(HttpClient);

  /**
   * Retrieves the health status of the application backend from the actuator endpoint.
   * This request bypasses the standard authentication guard/interceptor context.
   *
   * @returns An Observable emitting the actuator health status response.
   */
  public getHealth(): Observable<ActuatorHealthResponse> {
    return this.http.get<ActuatorHealthResponse>(HEALTH_URL, {
      context: new HttpContext().set(IS_AUTHENTICATED, false),
    });
  }
}
