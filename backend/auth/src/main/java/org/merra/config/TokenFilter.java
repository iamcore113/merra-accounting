package org.merra.config;

import java.io.IOException;

import org.merra.service.TokenBlacklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/*
 * In Spring Security, any filter bean that extends OncePerRequestFilter
 * is automatically added to the security filter chain, regardless of whether you
 * explicitly add it or not.
*/
@Component("tokenFilter")
public class TokenFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(TokenFilter.class);
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    public TokenFilter(JwtUtils jwtUtils, UserDetailsService userDetailsService,
            TokenBlacklistService tokenBlacklistService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return; // Exit early
        }
        final String jwt = authHeader.substring(7);

        // Check if token is blacklisted
        if (tokenBlacklistService.isBlacklisted(jwt)) {
            logger.warn("Attempted authentication with blacklisted token for URI: {}", request.getRequestURI());
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String email = jwtUtils.extractUsername(jwt);
            logger.info("Extracted Email: {}", email);

            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                logger.info("Authorities: {}", userDetails.getAuthorities());

                if (jwtUtils.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            logger.warn("Cannot set user authentication from token: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }
}
