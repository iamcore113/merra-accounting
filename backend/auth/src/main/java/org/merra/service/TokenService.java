package org.merra.service;

import java.util.Map;
import java.util.UUID;

import org.merra.config.JwtUtils;
import org.merra.dto.JwtTokens;
import org.merra.dto.ValidateTokenResponse;
import org.merra.entities.UserAccount;
import org.merra.enums.UserAccountStatusEn;
import org.merra.repositories.UserAccountRepository;
import org.merra.services.UserAccountService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import jakarta.persistence.EntityNotFoundException;

@Service
public class TokenService {
    private final static String ROLE_ADVISOR = UserAccountStatusEn.ADVISOR.toString();
    private final static String ROLE_STANDARD = UserAccountStatusEn.STANDARD.toString();
    private final static String ROLE_READ_ONLY = UserAccountStatusEn.READ_ONLY.toString();
    private final static String ROLE_INVOICE_ONLY = UserAccountStatusEn.INVOICE_ONLY.toString();
    private final static String ROLE_IDLE = UserAccountStatusEn.IDLE.toString();

    @Value("${jwt.access.token.duration}")
    private int forAccessToken;
    @Value("${jwt.refresh.token-expiration}")
    private int refreshTokenExpiration;
    @Value("${jwt.email.verification-duration}")
    private int verificationTokenDuration;
    @Value("${jwt.access.limited}")
    private int limitedAccessTokenDuration;
    @Value("${spring.mail.username}")

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final UserAccountService userAccountService;
    private final UserAccountRepository userRepository;

    public TokenService(UserAccountRepository userRepository, UserAccountService userAccountService, JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.userAccountService = userAccountService;
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    public JwtTokens requestTokens(UUID userId) {
        if (!userRepository.existsById(userId)) {
        throw new EntityNotFoundException("User entity not found.");
        }
        UserAccount user = userAccountService.retrieveById(userId);
        final String userEmail = user.getEmail();
        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

        final String accessToken = jwtUtils.generateToken(userDetails.getUsername(), Map.of("role", ROLE_IDLE), forAccessToken, false);
        final String refreshToken = jwtUtils.generateToken(userDetails.getUsername(), Map.of("role", ROLE_IDLE), refreshTokenExpiration, true);
        return new JwtTokens(accessToken, refreshToken);
    }

    public ValidateTokenResponse validateToken(String token) {
        final String email = jwtUtils.extractUsername(token);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        boolean isTokenValid = true;
        if (!jwtUtils.isTokenValid(token, userDetails)) {
            isTokenValid = false;
        }
        return new ValidateTokenResponse(isTokenValid);
    }

    public JwtTokens obtainNewAccessToken(String refreshToken) {
        final String email = jwtUtils.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String getAccessToken = null;
        String getRefreshToken = null;
        if (jwtUtils.isTokenValid(refreshToken, userDetails)) {
            var getUser = userRepository.findUserByEmailIgnoreCase(email);
            if (getUser.isEmpty()) {
                throw new EntityNotFoundException("User with email " + email + " not found.");
            }
            UserAccount user = getUser.get();
            final Map<String, Object> claims = Map.of("role", user.getRoles());
            getAccessToken = jwtUtils.generateToken(email, claims, forAccessToken, false);
            getRefreshToken = jwtUtils.generateToken(email, claims, refreshTokenExpiration, true);
        }
        return new JwtTokens(getAccessToken, getRefreshToken);
    }
}
