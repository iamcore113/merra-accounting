package org.merra.config;

import java.io.IOException;

import org.merra.enums.UserAccountStatusEn;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TempTokenFilter extends OncePerRequestFilter {
    private static final Logger logger = LoggerFactory.getLogger(TempTokenFilter.class);
    private final JwtUtils jwtUtils;

    public TempTokenFilter(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        final String tempToken = request.getHeader("X-Temp-Token");
        if (tempToken == null) {
            filterChain.doFilter(request, response);
            return; // Exit early
        }
        
        final String role = jwtUtils.extractRole(tempToken);
        logger.info("Extracted User Role: {}", role);

        if (!role.equalsIgnoreCase(UserAccountStatusEn.PENDING.toString())){
            filterChain.doFilter(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

}
