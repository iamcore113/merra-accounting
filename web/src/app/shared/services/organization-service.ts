import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CREATE_ORGANIZATION, ORGANIZATION_METADATA_URL, CURRENT_ORGANIZATION } from '../api/organization';
import { Observable } from 'rxjs';
import { Config } from '../models/api_response';
import { CreateOrganizationRequest } from '../models/organization';
import { HttpContext } from '@angular/common/http';
import { IS_AUTHENTICATED } from '../context/auth.token';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private createOrganizationUrl = CREATE_ORGANIZATION;

  createOrganization(req: CreateOrganizationRequest): Observable<Config> {
    return this.http.post<Config>(this.createOrganizationUrl, req, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  getOrganizationMetadata(): Observable<Config> {
    return this.http.get<Config>(ORGANIZATION_METADATA_URL, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }

  getCurrentOrganization(): Observable<Config> {
    return this.http.get<Config>(CURRENT_ORGANIZATION, {
      context: new HttpContext().set(IS_AUTHENTICATED, true)
    });
  }
}
