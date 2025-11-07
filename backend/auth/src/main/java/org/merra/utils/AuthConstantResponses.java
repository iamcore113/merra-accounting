package org.merra.utils;

public class AuthConstantResponses {
	// exceptions
	public static final String INVALID_CREDENTIALS = "Invalid credentials";
	public static final String SIGNUP_FAILED = "Unable to signup";
	public static final String EMAIL_EXISTS = "Email already exists";
	public static final String INVALID_REFRESH_TOKEN = "Refresh token is invalid or expired.";
	public static final String AUTHENTICATION_REQUIRED = "Full authentication is required to access this resource.";
	// success
	public static final String LOGIN_SUCCESSFUL = "Login successful";
	public static final String ACCOUNT_CREATED = "Account created successfully";
	// email verification
	public static final String EMAIL_VERIFICATION = "Verification email sent.";
	public static final String EMAIL_VERIFICATION_RESEND = "Verification email resent.";

	private AuthConstantResponses() {
	}
}
