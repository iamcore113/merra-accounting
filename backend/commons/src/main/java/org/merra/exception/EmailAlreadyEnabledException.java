package org.merra.exception;

public class EmailAlreadyEnabledException extends RuntimeException {
    public EmailAlreadyEnabledException(String msg) {
        super(msg);
    }
}
