package org.merra.config;

import java.io.IOException;
import java.util.Date;
import java.util.concurrent.TimeUnit;

import io.jsonwebtoken.Claims;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
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
    private final RedisTemplate<String, Object> redisTemplate;

    public TokenFilter(JwtUtils jwtUtils, UserDetailsService userDetailsService, RedisTemplate<String, Object> redisTemplate) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");

        // Handle logout request
        if ("/api/v1/auth/logout".equals(request.getRequestURI())) {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String jwt = authHeader.substring(7);
                try {
                    Date expiration = jwtUtils.extractClaim(jwt, Claims::getExpiration);
                    long remainingTimeMs = expiration.getTime() - System.currentTimeMillis();
                    if (remainingTimeMs > 0) {
                        redisTemplate.opsForValue().set("blacklist:" + jwt, "blacklisted", remainingTimeMs, TimeUnit.MILLISECONDS);
                        logger.info("Blacklisted token on logout: remaining time {} ms", remainingTimeMs);
                    }
                } catch (Exception e) {
                    logger.error("Error blacklisting token on logout", e);
                }
            }
            filterChain.doFilter(request, response);
            return;
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return; // Exit early
        }
        final String jwt = authHeader.substring(7);

        // Check if token is blacklisted
        if (isTokenBlacklisted(jwt)) {
            logger.warn("Attempted authentication with blacklisted token");
            filterChain.doFilter(request, response);
            return;
        }

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
        filterChain.doFilter(request, response);
    }

    private boolean isTokenBlacklisted(String jwt) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey("blacklist:" + jwt));
        } catch (Exception e) {
            logger.error("Error checking token blacklist in Redis", e);
            return false;
        }
    }
}