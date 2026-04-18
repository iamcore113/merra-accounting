package org.merra.api;

import org.springframework.http.HttpStatus;

public final class ApiError extends JsonResponse {
    public ApiError(String message, boolean success, HttpStatus response) {
        super(message, success, response);
    }

    public ApiError(String message, Boolean success, HttpStatus response) {
        super(message, success, response);
    }
}