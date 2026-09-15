package org.merra.api;

import org.springframework.http.HttpStatus;

public final class ApiResponse<T> extends JsonResponse {
	private T data;

	public ApiResponse() {
		super();
	}

	public ApiResponse(String message, boolean success, HttpStatus status, T data) {
		super(message, success, status);
		this.data = data;
	}

	public T getData() {
		return data;
	}

	public void setData(T data) {
		this.data = data;
	}
}