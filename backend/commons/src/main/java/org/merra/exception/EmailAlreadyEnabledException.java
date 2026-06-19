package org.merra.exception;

public class EmailAlreadyEnabledException extends RuntimeException {
    public EmailAlreadyEnabledException(String msg) {
        if (msg == null)
            msg = "E-mail account is already enabled.";
        super(msg);
    }
}
