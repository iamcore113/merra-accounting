package org.merra.config;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class TenantInterceptor implements HandlerInterceptor {
	@Override
	public boolean preHandle(HttpServletRequest request,
							 HttpServletResponse response,
							 Object handler) throws Exception {
		String userId = request.getHeader("X-User-Context-ID");
		String organizationId = request.getHeader("X-Organization-ID");
		if (userId != null && !userId.isEmpty()) {
			TenantContext.setTenantId(UUID.fromString(userId), TenantContext.USER_TENANT);
		} else {
			response.sendError(HttpServletResponse.SC_BAD_REQUEST, "X-User-Context-ID header is missing");
			return false;
		}
		
		if (organizationId != null && !organizationId.isEmpty()) {
			TenantContext.setTenantId(UUID.fromString(organizationId), TenantContext.ORG_TENANT);
		} else {
			response.sendError(HttpServletResponse.SC_BAD_REQUEST, "X-Organization-ID header is missing");
			return false;
		}
		
		return true;
	}

	@Override
	public void afterCompletion(HttpServletRequest request,
							 HttpServletResponse response,
							 Object handler, Exception ex) throws Exception {
		TenantContext.clearAll();
	}

}
