// Corresponds to: backend/organization/src/main/java/org/merra/dto/ContactsByOrganizationResponse.java
export interface ContactsByOrganizationResponse {
	organizationName?: string;
	contactId: string;
	contactName: string;
	accountNumber?: string | null;
	emailAddress?: string | null;
	isSupplier: boolean;
	isCustomer: boolean;
	status?: string;
}

export type ContactsByOrganizationList = ContactsByOrganizationResponse[];

export interface CreateContactRequest {
	name: string;
	firstName?: string;
	lastName?: string;
	emailAddress?: string;
	accountNumber?: string;
	isSupplier?: boolean;
	isCustomer?: boolean;
	taxNumber?: string;
	companyNumber?: string;
	contactStatus?: string;
}

export interface ContactResponse {
	contactId: string;
	contactName: string;
}

export interface ContactAccountNumberExistsResponse {
	accountNumber: string;
	exists: boolean;
}
