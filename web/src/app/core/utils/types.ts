interface successResponse {
  message: string;
  result: string;
  status: string;
  data?: unknown;
}

interface errorResponse {
  message: string;
  result: string;
  status: string;
}

interface OrganizationPhoneDetails {
  phoneType: string;
  phoneNumber: string;
  phoneAreaCode: string;
  phoneCountryCode: string;
  isDefault: boolean;
}

interface financialYear {
  yearEndDay: number;
  yearEndMonth: number;
}

interface PaymentTerms {
  subElements: string[];
  types: string[];
}
export type Config = successResponse | errorResponse;

export type CountriesApi = {
  cca2: string;
  names: {
    common: string;
    official: string;
  }
};

export type CreateAccount = {
  email: string;
  password: string;
};

export type resendEmailVerification = {
  userId: string;
}

export type VerificationResponse = {
  resent: boolean;
  verificationToken: {token: string};
  userDetail: {userId: string; email: string};
};

export type VerifiedAccountResponse = {
  isVerified: boolean;
  email: string;
};

export type EmailVerified = {
  token: string;
};

export type CreateOrganization = {
  displayName: string;
  email: string;
  type: string; // uuid type
  country: string;
  financialYear: financialYear;
  currency: string;
};

export type OrganizationMetadata = {
  organizationTypes: Array<{id: string; name: string;}>;
  address: string[];
  paymentTerms: PaymentTerms;
};

export type FillUserPersonalInformation = {
  email: string;
firstName: string;
  lastName: string;
  country: string;
};
