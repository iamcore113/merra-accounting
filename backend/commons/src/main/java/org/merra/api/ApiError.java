package org.merra.api;

import org.springframework.http.HttpStatus;

public final class ApiError extends JsonResponse {
    public ApiError(String message, boolean result, HttpStatus response) {
        super(message, result, response);
    }

    public ApiError(String message, Boolean result, HttpStatus response) {
        super(message, result, response);
    }
}