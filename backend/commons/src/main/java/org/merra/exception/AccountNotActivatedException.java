package org.merra.exception;

public class AccountNotActivatedException extends RuntimeException {
    private final String email;

    public AccountNotActivatedException(String msg) {
        this(msg, null);
    }

    public AccountNotActivatedException(String msg, String email) {
        super(msg != null ? msg : "Account is not yet activated. Please verify your email using the 4-digit PIN code.");
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}
