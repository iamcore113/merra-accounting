// Organization DTOs and Enums

// Corresponds to: backend/organization/src/main/java/org/merra/enums/AddressEn.java
export enum AddressEn {
  ADDRESS1 = 'ADDRESS1',
  ADDRESS2 = 'ADDRESS2',
  ADDRESS3 = 'ADDRESS3',
  ADDRESS4 = 'ADDRESS4'
}

// Corresponds to: backend/organization/src/main/java/org/merra/enums/PaymentTermsEn.java
export enum PaymentTermsEn {
  BILLS = 'BILLS',
  SALES = 'SALES'
}

// Corresponds to: backend/organization/src/main/java/org/merra/enums/PaymentTermTypes.java
export enum PaymentTermTypes {
  DAYSAFTERBILLDATE = 'DAYSAFTERBILLDATE',
  DAYSAFTERBILLMONTH = 'DAYSAFTERBILLMONTH',
  OFCURRENTMONTH = 'OFCURRENTMONTH',
  OFFOLLOWINGMONTH = 'OFFOLLOWINGMONTH'
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/UserOrganizationResponse.UserDetails
export interface UserDetails {
  userId: string;
  fullName: string;
  email: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/UserOrganizationResponse.OrganizationDetails
export interface OrganizationDetails {
  organizationId: string;
  organizationName: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/UserOrganizationResponse.java
export interface UserOrganizationResponse {
  userDetails: UserDetails;
  organizations: OrganizationDetails[];
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CreateOrganizationRequest.FinancialYear
export interface FinancialYear {
  yearEndDay: number;
  yearEndMonth: number;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CreateOrganizationRequest.java
export interface CreateOrganizationRequest {
  displayName: string;
  type: string;
  email: string;
  country: string;
  financialYear: FinancialYear;
  currency: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/NewOrganizationResponse.UserDetails
export interface NewOrganizationUserDetails {
  userId: string;
  userInfoPresent: boolean;
  name: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/NewOrganizationResponse.java
export interface NewOrganizationResponse {
  organizationId: string;
  userDetails: NewOrganizationUserDetails;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganizationMetaDataResponse.OrganizationTypesMetaData
export interface OrganizationTypesMetaData {
  id: string;
  name: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganizationMetaDataResponse.PaymentTermsMetaData
export interface PaymentTermsMetaData {
  subElements: PaymentTermsEn[];
  types: PaymentTermTypes[];
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganizationMetaDataResponse.java
export interface OrganizationMetaDataResponse {
  organizationTypes: OrganizationTypesMetaData[];
  addresses: AddressEn[];
  paymentTerms: PaymentTermsMetaData;
}
