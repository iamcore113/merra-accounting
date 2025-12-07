import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Config } from '../../utils/types';
import { METADATA_ENDPOINT_VER1, META_DATA_ORGANIZATION } from '../../utils/api';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  readonly metadata: string = `${METADATA_ENDPOINT_VER1}${META_DATA_ORGANIZATION}`;

  public getMetadata(): Observable<Config> {
    return this.http.get<Config>(this.metadata);
  }

  constructor(private http: HttpClient) {
  }

}
