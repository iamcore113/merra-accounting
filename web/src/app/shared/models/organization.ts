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

// Corresponds to: backend/organization/src/main/java/org/merra/dto/AccountByOrganizationResponse.java
export interface AccountByOrganizationResponse {
  organizationID: string;
  accountID: string;
  code: string;
  accountName: string;
  accountType: string;
  description: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/AccountCodeExistsResponse.java
export interface AccountCodeExistsResponse {
  accountCode: string;
  exists: boolean;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/AccountResponse.java
export interface AccountResponse {
  accountID: string;
  code: string;
  name: string;
  taxType: string;
  status: string;
  updatedDate: string;
  addToWatchList: boolean;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CompleteContactRequest.java
export interface CompleteContactRequest {
  organizationId: string;
  name: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  accountNumber: string;
  companyNumber: string;
  contactStatus: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/ContactResponse.java
export interface ContactResponse {
  contactId: string;
  name: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CreateInvoiceRequest.LineItems
export interface LineItems {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;
  overrideTaxType: string;
  discountRate: number;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CreateInvoiceRequest.java
export interface CreateInvoiceRequest {
  invoiceType: string;
  contact: string;
  lineAmountType: string;
  lineItems: LineItems[];
  date: string;
  dueDate: string;
  status: string;
  taxEligible: boolean;
  reference: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/InvoiceTaxEligibility.java
export interface InvoiceTaxEligibility {
  organizationID: string;
  taxEligible: boolean;
  message: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganizationElementResponse.UserOrganizationRole
export interface UserOrganizationRole {
  role: string;
  description: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganizationElementResponse.OrganizationTypes
export interface OrganizationTypes {
  organizationTypeId: string;
  name: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganizationElementResponse.java
export interface OrganizationElementResponse {
  userRole: UserOrganizationRole[];
  organizationTypes: OrganizationTypes[];
  countryCode: string[];
  phoneDetails: Array<Record<string, string[]>>;
  addressTypes: string[];
  phoneTypes: string[];
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganizationUserInvitationUpdateRequest.java
export interface OrganizationUserInvitationUpdateRequest {
  invitationBy: string;
  invitationTo: string;
  updatedBy: string;
  invitationStatus: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/OrganziationSelectionResponse.java
export interface OrganizationSelectionResponse {
  organizationId: string;
  displayName: string;
  legalName: string;
  description: string;
  status: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/SimpleContactRequest.java
export interface SimpleContactRequest {
  name: string;
  organizationId: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/UpdateInvoiceResponse.java
export interface UpdateInvoiceResponse {
  invoiceID: string;
  formerStatus: string;
  currentStatus: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CurrentOrganizationResponse.Type
export interface CurrentOrganizationResponseType {
  typeId: string;
  name: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CurrentOrganizationResponse.Names
export interface CurrentOrganizationResponseNames {
  displayName: string;
  legalName: string;
  description: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CurrentOrganizationResponse.Address
export interface CurrentOrganizationResponseAddress {
  email: string;
  country: string;
  currency: string;
  timeZone: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CurrentOrganizationResponse.FinancialYearEmb
export interface CurrentOrganizationResponseFinancialYear {
  yearEndDay: string;
  yearEndMonth: string;
}

// Corresponds to: backend/organization/src/main/java/org/merra/dto/CurrentOrganizationResponse.java
export interface CurrentOrganizationResponse {
  organizationId: string;
  organizationType: CurrentOrganizationResponseType;
  names: CurrentOrganizationResponseNames;
  address: CurrentOrganizationResponseAddress;
  website: string;
  createdDate: string;
  status: string;
  financialYear: CurrentOrganizationResponseFinancialYear;
}

// Corresponds to: backend/user/src/main/java/org/merra/dto/UserOrganizationAffiliation.Organizations
export interface OrganizationAffiliation {
  organizationId: string;
  organizationName: string;
  role: string;
}

// Corresponds to: backend/user/src/main/java/org/merra/dto/UserOrganizationAffiliation.java
export interface UserOrganizationAffiliation {
  count: number;
  organizations: OrganizationAffiliation[];
}
