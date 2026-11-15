import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ACCEPT_INVITATION_URL,
  CREATE_INVITATION_URL,
  INVITATION_BASE_URL,
  REVOKE_INVITATION_URL,
  VERIFY_INVITATION_URL,
} from '../api/invitation';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { Config, SuccessResponse } from '../models/api_response';
import {
  AcceptInvitationResponse,
  CreateInvitationRequest,
  InvitationResponse,
  VerifyInvitationResponse,
} from '../models/invitation';

@Injectable({
  providedIn: 'root',
})
export class InvitationService {
  private readonly http = inject(HttpClient);

  getInvitations(): Observable<SuccessResponse<InvitationResponse[]>> {
    return this.http.get<SuccessResponse<InvitationResponse[]>>(INVITATION_BASE_URL, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  createInvitation(request: CreateInvitationRequest): Observable<SuccessResponse<InvitationResponse>> {
    return this.http.post<SuccessResponse<InvitationResponse>>(CREATE_INVITATION_URL, request, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  revokeInvitation(id: string): Observable<Config> {
    return this.http.delete<Config>(REVOKE_INVITATION_URL(id), {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  verifyInvitation(token: string): Observable<SuccessResponse<VerifyInvitationResponse>> {
    return this.http.get<SuccessResponse<VerifyInvitationResponse>>(VERIFY_INVITATION_URL, {
      params: { token },
    });
  }

  acceptInvitation(token: string): Observable<SuccessResponse<AcceptInvitationResponse>> {
    return this.http.post<SuccessResponse<AcceptInvitationResponse>>(
      ACCEPT_INVITATION_URL,
      { token },
      { context: new HttpContext().set(IS_AUTHENTICATED, true) }
    );
  }
}
