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
export interface SuccessResponse<T = any> extends JsonResponse {
  data: T;
}

/**
 * Interface corresponding to ApiError.java
 */
export interface ErrorResponse extends JsonResponse {
  // No additional properties beyond JsonResponse
}

export type Config = SuccessResponse | ErrorResponse;

/**
 * Interface corresponding to CountriesResponse.java DTO
 */
export interface RestCountry {
  countryId: string;
  countryName: string;
  isoAlpha2Code: string;
  isoAlpha3Code: string;
  isoNumericCode: string;
  symbol: string;
  code: string;
}
export type RestCountryList = RestCountry[];

interface RestCountriesSelectionObj {
  name: string;
  cca2: string;
  currency: string;
}

export type RestCountriesSelection = RestCountriesSelectionObj[];

interface ActuatorHealth {
  groups: string[];
  status: string
}

export type ActuatorHealthResponse = ActuatorHealth

