package org.merra.config.multitenancy;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.merra.multitenancy.TenantContext;
import org.merra.multitenancy.TenantInfo;
import org.merra.multitenancy.TenantResolver;
import org.merra.repositories.OrganizationMembersRepository;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.utilities.RedisKeys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Filter executed per request to resolve, validate, and activate the tenant schema in {@link TenantContext}.
 *
 * Checks performed:
 * 1. Resolves tenant from HTTP header 'X-Organization-Id' / 'X-Tenant-Id' or user active workspace state.
 * 2. Checks tenant status (ACTIVE_ACCOUNT) and matches the schema name against the registered schema.
 * 3. Utilizes Redis caching for tenant metadata lookups to maximize request throughput.
 * 4. Verifies that the authenticated user belongs to the requested organization before activating the tenant schema.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class TenantFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(TenantFilter.class);

    public static final String HEADER_ORGANIZATION_ID = "X-Organization-Id";
    public static final String HEADER_TENANT_ID = "X-Tenant-Id";

    private final OrganizationMembersRepository organizationMembersRepository;
    private final UserWorkspaceStateRepository userWorkspaceStateRepository;
    private final OrganizationRepository organizationRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    public TenantFilter(
            OrganizationMembersRepository organizationMembersRepository,
            UserWorkspaceStateRepository userWorkspaceStateRepository,
            OrganizationRepository organizationRepository,
            RedisTemplate<String, Object> redisTemplate) {
        this.organizationMembersRepository = organizationMembersRepository;
        this.userWorkspaceStateRepository = userWorkspaceStateRepository;
        this.organizationRepository = organizationRepository;
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication != null && authentication.isAuthenticated()
                    && authentication.getPrincipal() instanceof UserAccount user) {

                UUID requestedOrgId = resolveOrganizationId(request);

                // If not provided in header, try resolving from user's current workspace state
                if (requestedOrgId == null) {
                    Optional<Organization> currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal();
                    if (currentOrg.isPresent()) {
                        requestedOrgId = currentOrg.get().getId();
                    }
                }

                if (requestedOrgId != null) {
                    // 1. Retrieve tenant metadata (from Redis cache or fallback to database)
                    TenantInfo tenantInfo = getTenantInfo(requestedOrgId);

                    if (tenantInfo == null) {
                        logger.warn("Access denied: Organization {} does not exist", requestedOrgId);
                        sendErrorResponse(response, HttpStatus.FORBIDDEN, "Organization not found");
                        return;
                    }

                    // 2. Validate tenant status
                    if (!tenantInfo.isActive()) {
                        logger.warn("Access denied: Organization {} is not active (status: {})",
                                requestedOrgId, tenantInfo.status());
                        sendErrorResponse(response, HttpStatus.FORBIDDEN,
                                "Organization account is not active (" + tenantInfo.status() + ")");
                        return;
                    }

                    // 3. Validate that generated schema name matches the registered schema_name
                    String expectedSchema = TenantResolver.toSchemaName(requestedOrgId);
                    if (tenantInfo.schemaName() != null && !tenantInfo.schemaName().trim().isEmpty()
                            && !tenantInfo.schemaName().equalsIgnoreCase(expectedSchema)) {
                        logger.error("Tenant schema mismatch: Organization {} registered schema '{}' != expected '{}'",
                                requestedOrgId, tenantInfo.schemaName(), expectedSchema);
                        sendErrorResponse(response, HttpStatus.FORBIDDEN, "Tenant schema validation failed");
                        return;
                    }

                    // 4. Security verification: ensure authenticated user is actually a member of this organization
                    boolean isMember = organizationMembersRepository.isUserMemberOfOrganization(
                            requestedOrgId, user.getUserId());

                    if (!isMember) {
                        logger.warn("Access denied: User {} attempted to access unauthorized organization {}",
                                user.getEmail(), requestedOrgId);
                        sendErrorResponse(response, HttpStatus.FORBIDDEN, "Access denied to organization");
                        return;
                    }

                    String tenantSchema = (tenantInfo.schemaName() != null && !tenantInfo.schemaName().trim().isEmpty())
                            ? tenantInfo.schemaName().trim()
                            : expectedSchema;
                    TenantContext.setCurrentTenant(tenantSchema);
                    logger.debug("Switched TenantContext to '{}' for user {}", tenantSchema, user.getEmail());
                } else {
                    TenantContext.setCurrentTenant(TenantContext.DEFAULT_TENANT);
                }
            } else {
                TenantContext.setCurrentTenant(TenantContext.DEFAULT_TENANT);
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private TenantInfo getTenantInfo(UUID orgId) {
        String cacheKey = RedisKeys.getTenantInfoKey(orgId);
        if (redisTemplate != null) {
            try {
                Object cached = redisTemplate.opsForValue().get(cacheKey);
                if (cached instanceof TenantInfo info) {
                    return info;
                }
            } catch (Exception e) {
                logger.warn("Redis lookup failed for key '{}': {}", cacheKey, e.getMessage());
            }
        }

        Organization org = organizationRepository.findById(orgId).orElse(null);
        if (org == null) {
            return null;
        }

        String schemaName = (org.getSchemaName() != null && !org.getSchemaName().trim().isEmpty())
                ? org.getSchemaName().trim()
                : TenantResolver.toSchemaName(orgId);
        String status = org.getStatus() != null ? org.getStatus().name() : null;
        TenantInfo info = new TenantInfo(schemaName, status);

        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set(cacheKey, info, RedisKeys.CONSTANT_DURATION);
            } catch (Exception e) {
                logger.warn("Redis caching failed for key '{}': {}", cacheKey, e.getMessage());
            }
        }
        return info;
    }

    private void sendErrorResponse(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"success\":false,\"message\":\"" + message + "\"}");
    }

    private UUID resolveOrganizationId(HttpServletRequest request) {
        String orgHeader = request.getHeader(HEADER_ORGANIZATION_ID);
        if (orgHeader == null || orgHeader.trim().isEmpty()) {
            orgHeader = request.getHeader(HEADER_TENANT_ID);
        }

        if (orgHeader != null && !orgHeader.trim().isEmpty()) {
            try {
                return UUID.fromString(orgHeader.trim());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid UUID format in tenant header: {}", orgHeader);
            }
        }
        return null;
    }
}
