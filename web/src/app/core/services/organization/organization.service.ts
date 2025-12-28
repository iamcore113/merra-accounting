import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Config, CreateOrganizationPayload } from '../../utils/types';
import { METADATA_ENDPOINT_VER1, META_DATA_ORGANIZATION, CREATE_NEW_ORGANIZATION } from '../../utils/api';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  readonly metadata: string = `${METADATA_ENDPOINT_VER1}${META_DATA_ORGANIZATION}`;
  readonly createOrganizationEndpoint: string = CREATE_NEW_ORGANIZATION;
  public getMetadata(): Observable<Config> {
    return this.http.get<Config>(this.metadata);
  }

  constructor(private http: HttpClient) {
  }

  public createOrganization(req: CreateOrganizationPayload): Observable<Config> {
    return this.http.post<Config>(this.createOrganizationEndpoint, req);
  }

}
