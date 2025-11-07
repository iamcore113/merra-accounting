package org.merra.config;

import java.io.IOException;

import org.merra.api.ApiError;
import org.merra.utils.AuthConstantResponses;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthEntrypointJwt implements AuthenticationEntryPoint {
	private static final Logger logger = LoggerFactory.getLogger(AuthEntrypointJwt.class);

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) throws IOException, ServletException {
		logger.error("Unauthorized error: {}", authException.getMessage());

		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

		// final Map<String, Object> body = new HashMap<>();
		// body.put("status", HttpServletResponse.SC_UNAUTHORIZED);
		// body.put("error", "Unauthorized");
		// body.put("message", authException.getMessage());
		// body.put("path", request.getServletPath());

		ApiError apiError = new ApiError(
				AuthConstantResponses.AUTHENTICATION_REQUIRED,
				false,
				HttpStatus.UNAUTHORIZED);

		final ObjectMapper mapper = new ObjectMapper();
		mapper.writeValue(response.getOutputStream(), apiError);
	}

}