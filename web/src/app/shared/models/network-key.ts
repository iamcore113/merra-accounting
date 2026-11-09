export interface NetworkKeyResponse {
  id: string;
  organizationId: string;
  networkKey: string;
  name?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface GenerateNetworkKeyRequest {
  name?: string;
}

export interface ResolveNetworkKeyResponse {
  isValid: boolean;
  organizationId?: string;
  organizationName?: string;
  legalName?: string;
  country?: string;
  currency?: string;
  message?: string;
}
