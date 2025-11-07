package org.merra.api;

import org.springframework.http.HttpStatus;

public final class ApiResponse extends JsonResponse {
	private Object data;
	
	public ApiResponse() {
		super();
	}
	public ApiResponse(String message, boolean result, HttpStatus status, Object data) {
		super(message, result, status);
		this.data = data;
	}

	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}
}