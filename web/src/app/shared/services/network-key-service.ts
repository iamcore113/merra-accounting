import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NETWORK_KEY_BASE, GENERATE_NETWORK_KEY, RESOLVE_NETWORK_KEY, DELETE_NETWORK_KEY } from '../api/network-key';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { Config, SuccessResponse } from '../models/api_response';
import { GenerateNetworkKeyRequest, NetworkKeyResponse, ResolveNetworkKeyResponse } from '../models/network-key';

@Injectable({
  providedIn: 'root',
})
export class NetworkKeyService {
  private readonly http = inject(HttpClient);

  getActiveKeys(): Observable<SuccessResponse<NetworkKeyResponse[]>> {
    return this.http.get<SuccessResponse<NetworkKeyResponse[]>>(NETWORK_KEY_BASE, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  generateNetworkKey(request?: GenerateNetworkKeyRequest): Observable<SuccessResponse<NetworkKeyResponse>> {
    return this.http.post<SuccessResponse<NetworkKeyResponse>>(GENERATE_NETWORK_KEY, request || {}, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  deleteNetworkKey(id: string): Observable<Config> {
    return this.http.delete<Config>(DELETE_NETWORK_KEY(id), {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  resolveNetworkKey(key: string): Observable<SuccessResponse<ResolveNetworkKeyResponse>> {
    return this.http.get<SuccessResponse<ResolveNetworkKeyResponse>>(RESOLVE_NETWORK_KEY, {
      params: { key },
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }
}
