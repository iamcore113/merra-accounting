import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Config, CreateOrganizationPayload } from '../../utils/types';
import { METADATA_ENDPOINT_VER1, META_DATA_ORGANIZATION, CREATE_NEW_ORGANIZATION, USER_ORGANIZATIONS } from '../../utils/api';
import { LocalStorageService } from '../localStorage/localStorage.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  readonly metadata: string = `${METADATA_ENDPOINT_VER1}${META_DATA_ORGANIZATION}`;
  userId: any;
  readonly createOrganizationEndpoint: string = CREATE_NEW_ORGANIZATION;
  public getMetadata(): Observable<Config> {
    return this.http.get<Config>(this.metadata);
  }

  constructor(private http: HttpClient, private storage: LocalStorageService) {
    this.userId = this.storage.getItem('user_id');
  }

  public createOrganization(req: CreateOrganizationPayload): Observable<Config> {
    const newOrganizationEndpoint = `${this.createOrganizationEndpoint}${this.userId}`;
    return this.http.post<Config>(newOrganizationEndpoint, req);
  }

  public getUserOrganizations(): Observable<Config> {
    const userOrganizationsEndpoint = `${USER_ORGANIZATIONS}${this.userId}`;
    return this.http.get<Config>(userOrganizationsEndpoint);
  }

}
