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
  verificationToken: string;
  userId: string;
  email: string;
};

export type EmailVerificationSuccess = {
  accountEmail: string;
  accountId: string;
  isVerified: string;
};

export type EmailVerified = {
  token: string;
};

export type CreateOrganization = {
  organizationName: string;
  organizationAddress: string;
  organizationCountry: string;
  organizationPhone: string;
};
