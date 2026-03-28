import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CREATE_ORGANIZATION } from '../api/organization';
import { Observable } from 'rxjs';
import { Config } from '../models/api_response';
import { CreateOrganizationRequest } from '../models/organization';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private http = inject(HttpClient);
  private createOrganizationUrl = CREATE_ORGANIZATION;

  createOrganization(req: CreateOrganizationRequest, userId: string): Observable<Config> {
    const url = `${this.createOrganizationUrl}/${userId}`;
    return this.http.post<Config>(url, req);
  }
}
