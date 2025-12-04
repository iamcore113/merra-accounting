package org.merra.config;

import java.io.IOException;
import org.springframework.stereotype.Service;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Service
public class HeaderFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String xTenantId = request.getHeader("X-Tenant-ID");
        if (xTenantId == null) {
            filterChain.doFilter(request, response);
            return;
        }
        filterChain.doFilter(request, response);

        // throw new UnsupportedOperationException("Unimplemented method
        // 'doFilterInternal'");
    }

}
