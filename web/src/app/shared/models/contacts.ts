// Corresponds to: backend/organization/src/main/java/org/merra/dto/ContactsByOrganizationResponse.java
export interface ContactsByOrganizationResponse {
	organizationName: string;
	contactId: string;
	contactName: string;
}

export type ContactsByOrganizationList = ContactsByOrganizationResponse[];
