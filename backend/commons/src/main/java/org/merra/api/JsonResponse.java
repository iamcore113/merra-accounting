package org.merra.api;

import org.springframework.http.HttpStatus;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

sealed class JsonResponse permits ApiError, ApiResponse {

	@NotBlank(message = "message attribute cannot be blank.")
	private String message;

	@NotNull(message = "success attribute cannot be null.")
	private boolean success;

	@NotNull(message = "response attribute cannot be null.")
	private HttpStatus response;

	public JsonResponse(String msg, boolean success, HttpStatus status) {
		this.message = msg.isBlank() ? "Request sent successfully" : msg;
		this.success = success;
		this.response = status;
	}

	public JsonResponse() {
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	public HttpStatus getResponse() {
		return response;
	}

	public void setResponse(HttpStatus response) {
		this.response = response;
	}

}