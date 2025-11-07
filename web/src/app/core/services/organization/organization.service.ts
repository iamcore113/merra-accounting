import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Config } from '../../utils/types';
import { API_VERSION_1, ORGANIZATION_MAPPING, ORGANIZATION_TEST } from '../../utils/api';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  readonly organizationApiUrl = `${API_VERSION_1}${ORGANIZATION_MAPPING}${ORGANIZATION_TEST}`;

  getTestOrganization(): Observable<Config> {
    return this.http.get<Config>(this.organizationApiUrl);
  }
  constructor(private http: HttpClient) {
  }

}
