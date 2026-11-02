package org.merra.config.multitenancy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Optional;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.merra.enums.StatusEn;
import org.merra.multitenancy.TenantContext;
import org.merra.multitenancy.TenantInfo;
import org.merra.multitenancy.TenantResolver;
import org.merra.repositories.OrganizationMembersRepository;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

class TenantFilterTest {

    private OrganizationMembersRepository organizationMembersRepository;
    private UserWorkspaceStateRepository userWorkspaceStateRepository;
    private OrganizationRepository organizationRepository;
    private RedisTemplate<String, Object> redisTemplate;
    private ValueOperations<String, Object> valueOperations;
    private TenantFilter tenantFilter;

    private HttpServletRequest request;
    private HttpServletResponse response;
    private FilterChain filterChain;
    private StringWriter responseWriter;

    private UserAccount testUser;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws IOException {
        organizationMembersRepository = mock(OrganizationMembersRepository.class);
        userWorkspaceStateRepository = mock(UserWorkspaceStateRepository.class);
        organizationRepository = mock(OrganizationRepository.class);
        redisTemplate = mock(RedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        tenantFilter = new TenantFilter(
                organizationMembersRepository,
                userWorkspaceStateRepository,
                organizationRepository,
                redisTemplate);

        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        filterChain = mock(FilterChain.class);
        responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        testUser = new UserAccount("test@merra.com", "password");
        try {
            var field = UserAccount.class.getDeclaredField("userId");
            field.setAccessible(true);
            field.set(testUser, UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
    }

    @Test
    @DisplayName("Unauthenticated request executes with default 'app' tenant")
    void doFilter_unauthenticated() throws ServletException, IOException {
        tenantFilter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
    }

    @Test
    @DisplayName("Authenticated user with active organization and matching schema switches to tenant schema")
    void doFilter_authenticated_activeAndMatchingSchema() throws ServletException, IOException {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        UUID orgId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        String expectedSchema = TenantResolver.toSchemaName(orgId);

        when(request.getHeader(TenantFilter.HEADER_ORGANIZATION_ID)).thenReturn(orgId.toString());

        Organization org = new Organization();
        org.setStatus(StatusEn.ACTIVE_ACCOUNT);
        org.setSchemaName(expectedSchema);
        when(valueOperations.get(anyString())).thenReturn(null);
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(organizationMembersRepository.isUserMemberOfOrganization(orgId, testUser.getUserId())).thenReturn(true);

        tenantFilter.doFilter(request, response, (req, res) -> {
            assertThat(TenantContext.getCurrentTenant()).isEqualTo(expectedSchema);
        });

        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
    }

    @Test
    @DisplayName("Authenticated user with inactive organization status receives 403 Forbidden")
    void doFilter_authenticated_inactiveOrganization() throws ServletException, IOException {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        UUID orgId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        when(request.getHeader(TenantFilter.HEADER_ORGANIZATION_ID)).thenReturn(orgId.toString());

        // Cached as suspended / zombie
        TenantInfo suspendedInfo = new TenantInfo(TenantResolver.toSchemaName(orgId), StatusEn.DISCONTINUED_ACCOUNT.name());
        when(valueOperations.get(anyString())).thenReturn(suspendedInfo);

        tenantFilter.doFilter(request, response, filterChain);

        verify(response).setStatus(403);
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(responseWriter.toString()).contains("Organization account is not active");
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
    }

    @Test
    @DisplayName("Authenticated user with schema mismatch receives 403 Forbidden")
    void doFilter_authenticated_schemaMismatch() throws ServletException, IOException {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        UUID orgId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        when(request.getHeader(TenantFilter.HEADER_ORGANIZATION_ID)).thenReturn(orgId.toString());

        TenantInfo mismatchedInfo = new TenantInfo("tenant_tampered_schema_123456789012", StatusEn.ACTIVE_ACCOUNT.name());
        when(valueOperations.get(anyString())).thenReturn(mismatchedInfo);

        tenantFilter.doFilter(request, response, filterChain);

        verify(response).setStatus(403);
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(responseWriter.toString()).contains("Tenant schema validation failed");
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
    }

    @Test
    @DisplayName("Authenticated user accessing unauthorized organization receives 403 Forbidden")
    void doFilter_authenticated_nonMember() throws ServletException, IOException {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        UUID orgId = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
        when(request.getHeader(TenantFilter.HEADER_ORGANIZATION_ID)).thenReturn(orgId.toString());

        TenantInfo validInfo = new TenantInfo(TenantResolver.toSchemaName(orgId), StatusEn.ACTIVE_ACCOUNT.name());
        when(valueOperations.get(anyString())).thenReturn(validInfo);
        when(organizationMembersRepository.isUserMemberOfOrganization(orgId, testUser.getUserId())).thenReturn(false);

        tenantFilter.doFilter(request, response, filterChain);

        verify(response).setStatus(403);
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(responseWriter.toString()).contains("Access denied to organization");
        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
    }

    @Test
    @DisplayName("Authenticated user without header resolves from active workspace state")
    void doFilter_authenticated_fallbackWorkspace() throws ServletException, IOException {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        UUID workspaceOrgId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        String expectedSchema = TenantResolver.toSchemaName(workspaceOrgId);
        Organization org = new Organization();
        try {
            var idField = Organization.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(org, workspaceOrgId);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        when(userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()).thenReturn(Optional.of(org));
        TenantInfo validInfo = new TenantInfo(expectedSchema, StatusEn.ACTIVE_ACCOUNT.name());
        when(valueOperations.get(anyString())).thenReturn(validInfo);
        when(organizationMembersRepository.isUserMemberOfOrganization(workspaceOrgId, testUser.getUserId())).thenReturn(true);

        tenantFilter.doFilter(request, response, (req, res) -> {
            assertThat(TenantContext.getCurrentTenant()).isEqualTo(expectedSchema);
        });

        assertThat(TenantContext.getCurrentTenant()).isEqualTo(TenantContext.DEFAULT_TENANT);
    }
}
