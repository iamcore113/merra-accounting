export interface CreateInvitationRequest {
  inviteeEmail: string;
  role: string;
  sendEmail: boolean;
}

export interface InvitationResponse {
  id: string;
  organizationId: string;
  organizationDisplayName: string;
  organizationLegalName: string;
  inviteeEmail: string;
  role: string;
  invitationToken: string;
  invitationLink: string;
  emailSent: boolean;
  isActive: boolean;
  expiresAt?: string;
  createdAt?: string;
}

export interface VerifyInvitationResponse {
  valid: boolean;
  message: string;
  inviteeEmail?: string;
  organizationId?: string;
  organizationDisplayName?: string;
  organizationLegalName?: string;
  role?: string;
  expiresAt?: string;
  accountExists?: boolean;
}

export interface AcceptInvitationRequest {
  token: string;
}

export interface RegisterAndAcceptInvitationRequest {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  password: string;
}

export interface AcceptInvitationResponse {
  organizationId: string;
  organizationDisplayName: string;
  organizationLegalName: string;
  role: string;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

export const ORGANIZATION_INVITATION_ROLES = [
  { label: 'Advisor (Administrator)', value: 'ADVISOR' },
  { label: 'Standard', value: 'STANDARD' },
  { label: 'Invoice Only', value: 'INVOICE_ONLY' },
  { label: 'Read Only', value: 'READ_ONLY' },
  { label: 'Member', value: 'MEMBER' },
];
