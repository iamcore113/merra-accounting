package org.merra.config;

import java.util.Objects;
import java.util.UUID;

public class TenantContext {
	private static final ThreadLocal<UUID> currentUserTenant = new ThreadLocal<>();
	private static final ThreadLocal<UUID> currentOrganizationTenant = new ThreadLocal<>();
	
	public static final String USER_TENANT = "USER_TENANT";
	public static final String ORG_TENANT = "ORG_TENANT";
	
	public static void setTenantId(UUID tenantId, String tenantType) {
		if (Objects.equals(tenantType, USER_TENANT)) {
			currentUserTenant.set(tenantId);
		} else if (Objects.equals(tenantType, ORG_TENANT)) {
			currentOrganizationTenant.set(tenantId);
		}
	}
    public static UUID getTenantId(String tenantType) { 
    	if (Objects.equals(tenantType, USER_TENANT)) {
    		return currentUserTenant.get();
    	} else if (Objects.equals(tenantType, ORG_TENANT)) {
    		return currentOrganizationTenant.get();
    	}
    	return null;
    }
    public static void clearAll() {
    	currentUserTenant.remove();
    	currentOrganizationTenant.remove();
    }
    
    public static void clear(String tenantType) {
    	if (Objects.equals(tenantType, USER_TENANT)) {
			currentUserTenant.remove();
		} else if (Objects.equals(tenantType, ORG_TENANT)) {
			currentOrganizationTenant.remove();
		}
	}
}
