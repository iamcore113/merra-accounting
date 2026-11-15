package org.merra.dto;

/**
 * State of a password reset token.
 *
 * @param valid   the token can still be used
 * @param expired the token is known but past its deadline (so the UI can show
 *                the "link expired" page); {@code false} for unknown tokens
 */
public record PasswordResetTokenStatusResponse(boolean valid, boolean expired) {
}
