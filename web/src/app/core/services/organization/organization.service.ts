import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Config } from '../../utils/types';
import { API_VERSION_1, ORGANIZATION_MAPPING, ORGANIZATION_METADATA } from '../../utils/api';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  readonly metadata: string = `${API_VERSION_1}${ORGANIZATION_MAPPING}${ORGANIZATION_METADATA}`;

  public getMetadata(): Observable<Config> {
    return this.http.get<Config>(this.metadata);
  }

  constructor(private http: HttpClient) {
  }

}
