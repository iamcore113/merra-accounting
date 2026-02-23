/**
 * Base interface corresponding to JsonResponse.java
 */
export interface JsonResponse {
  message: string;
  result: boolean;
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
