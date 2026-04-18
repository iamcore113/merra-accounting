/**
 * Base interface corresponding to JsonResponse.java
 */
interface JsonResponse {
  message: string;
  success: boolean;
  response: number; // HttpStatus mapped to number
}

/**
 * Interface corresponding to ApiResponse.java
 * Generic type T allows for type-safe data property
 */
interface SuccessResponse<T = any> extends JsonResponse {
  data: T;
}

/**
 * Interface corresponding to ApiError.java
 */
interface ErrorResponse extends JsonResponse {
  // No additional properties beyond JsonResponse
}

export type Config = SuccessResponse | ErrorResponse;

/**
 * Interface for REST Countries API response
 * Based on https://restcountries.com/v3.1/all?fields=name,cca2,currencies
 */
interface RestCountry {
  name: {
    common: string;
    official: string;
    nativeName: {
      [languageCode: string]: {
        official: string;
        common: string;
      };
    };
  };
  currencies: {
    [currencyCode: string]: {
      name: string;
      symbol: string;
    };
  };
  cca2: string;
}
export type RestCountryList = RestCountry[];

interface RestCountriesSelectionObj {
  name: string;
  cca2: string;
  currency: string;
}

export type RestCountriesSelection = RestCountriesSelectionObj[];
