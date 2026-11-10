package org.merra.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.EntityNotFoundException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.merra.dto.CurrentOrganizationResponse;
import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.merra.entities.UserWorkspaceState;
import org.merra.mapper.OrganizationAffiliationMapper;
import org.merra.mapper.OrganizationMapper;
import org.merra.repositories.AddressTypeRepository;
import org.merra.repositories.CountryRepository;
import org.merra.repositories.InvoiceRepository;
import org.merra.repositories.OrganizationMembersRepository;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.OrganizationTypeRepository;
import org.merra.repositories.UserAccountRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class UserWorkspaceStateSchedulerTest {

    @Mock
    private UserWorkspaceStateRepository userWorkspaceStateRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMembersRepository organizationMembersRepository;

    @Mock
    private OrganizationMapper organizationMapper;

    private UserWorkspaceStateScheduler scheduler;
    private OrganizationService organizationService;

    private UserAccount testUser;
    private Organization testOrg;
    private UUID userId;
    private UUID orgId;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() throws Exception {
        scheduler = new UserWorkspaceStateScheduler(userWorkspaceStateRepository);

        organizationService = new OrganizationService(
                organizationRepository,
                mock(UserAccountService.class),
                mock(OrganizationTypeRepository.class),
                mock(AddressTypeRepository.class),
                organizationMembersRepository,
                userWorkspaceStateRepository,
                mock(InvoiceRepository.class),
                mock(AccountService.class),
                mock(CountryRepository.class),
                mock(UserAccountRepository.class),
                organizationMapper,
                mock(OrganizationAffiliationMapper.class),
                mock(RedisTemplate.class));

        userId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        orgId = UUID.fromString("22222222-2222-2222-2222-222222222222");

        testUser = new UserAccount("user@merra.com", "password");
        var userIdField = UserAccount.class.getDeclaredField("userId");
        userIdField.setAccessible(true);
        userIdField.set(testUser, userId);

        testOrg = new Organization();
        testOrg.setId(orgId);
        testOrg.setDisplayName("Acme Ltd");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("cleanupExpiredWorkspaceStates deletes records older than 24 hours")
    void cleanupExpiredWorkspaceStates_deletesStaleRecords() {
        OffsetDateTime beforeCall = OffsetDateTime.now().minusHours(24).minusSeconds(5);
        when(userWorkspaceStateRepository.deleteInactiveWorkspaceStates(any(OffsetDateTime.class))).thenReturn(2);

        scheduler.cleanupExpiredWorkspaceStates();

        ArgumentCaptor<OffsetDateTime> cutoffCaptor = ArgumentCaptor.forClass(OffsetDateTime.class);
        verify(userWorkspaceStateRepository).deleteInactiveWorkspaceStates(cutoffCaptor.capture());

        OffsetDateTime capturedCutoff = cutoffCaptor.getValue();
        assertThat(capturedCutoff).isAfter(beforeCall);
        assertThat(capturedCutoff).isBeforeOrEqualTo(OffsetDateTime.now().minusHours(24));
    }

    @Test
    @DisplayName("checkAndRefreshWorkspace returns true and updates lastActiveAt when active within 24 hours")
    void checkAndRefreshWorkspace_activeWithin24Hours_refreshesAndReturnsTrue() {
        OffsetDateTime twoHoursAgo = OffsetDateTime.now().minusHours(2);
        UserWorkspaceState state = new UserWorkspaceState(testUser, testOrg, twoHoursAgo);
        when(userWorkspaceStateRepository.findByUserId(userId)).thenReturn(Optional.of(state));

        boolean result = scheduler.checkAndRefreshWorkspace(userId);

        assertThat(result).isTrue();
        assertThat(state.getLastActiveAt()).isAfter(twoHoursAgo);
        verify(userWorkspaceStateRepository).save(state);
        verify(userWorkspaceStateRepository, never()).deleteByUserId(any());
    }

    @Test
    @DisplayName("checkAndRefreshWorkspace deletes record and returns false when inactive for more than 24 hours")
    void checkAndRefreshWorkspace_expiredOver24Hours_deletesAndReturnsFalse() {
        OffsetDateTime twentyFiveHoursAgo = OffsetDateTime.now().minusHours(25);
        UserWorkspaceState state = new UserWorkspaceState(testUser, testOrg, twentyFiveHoursAgo);
        when(userWorkspaceStateRepository.findByUserId(userId)).thenReturn(Optional.of(state));

        boolean result = scheduler.checkAndRefreshWorkspace(userId);

        assertThat(result).isFalse();
        verify(userWorkspaceStateRepository).deleteByUserId(userId);
        verify(userWorkspaceStateRepository, never()).save(any());
    }

    @Test
    @DisplayName("checkAndRefreshWorkspace returns false when no workspace state record exists")
    void checkAndRefreshWorkspace_missingRecord_returnsFalse() {
        when(userWorkspaceStateRepository.findByUserId(userId)).thenReturn(Optional.empty());

        boolean result = scheduler.checkAndRefreshWorkspace(userId);

        assertThat(result).isFalse();
        verify(userWorkspaceStateRepository, never()).save(any());
    }

    @Test
    @DisplayName("selectOrganization saves workspace state and refreshes lastActiveAt when user is a member")
    void selectOrganization_member_savesWorkspaceState() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
        when(organizationMembersRepository.isUserMemberOfOrganization(orgId, userId)).thenReturn(true);
        when(userWorkspaceStateRepository.findByUser(testUser)).thenReturn(Optional.empty());

        CurrentOrganizationResponse expectedResponse = new CurrentOrganizationResponse(
                orgId,
                new CurrentOrganizationResponse.Type(UUID.randomUUID(), "LLC"),
                new CurrentOrganizationResponse.Names("Acme Ltd", "Acme Ltd", "Description"),
                new CurrentOrganizationResponse.Contact("info@acme.com", "US", "USD", "UTC", java.util.List.of()),
                "https://acme.com",
                java.time.LocalDate.now(),
                "ACTIVE_ACCOUNT",
                new CurrentOrganizationResponse.FinancialYearEmb("31", "12"));
        when(organizationMapper.toCurrentOrganizationResponse(testOrg)).thenReturn(expectedResponse);

        CurrentOrganizationResponse actualResponse = organizationService.selectOrganization(orgId);

        assertThat(actualResponse).isEqualTo(expectedResponse);

        ArgumentCaptor<UserWorkspaceState> stateCaptor = ArgumentCaptor.forClass(UserWorkspaceState.class);
        verify(userWorkspaceStateRepository).save(stateCaptor.capture());

        UserWorkspaceState savedState = stateCaptor.getValue();
        assertThat(savedState.getUser()).isEqualTo(testUser);
        assertThat(savedState.getCurrentOrganization()).isEqualTo(testOrg);
        assertThat(savedState.getLastActiveAt()).isNotNull();
    }

    @Test
    @DisplayName("selectOrganization throws IllegalArgumentException when user is not a member of the organization")
    void selectOrganization_nonMember_throwsIllegalArgumentException() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(testOrg));
        when(organizationMembersRepository.isUserMemberOfOrganization(orgId, userId)).thenReturn(false);

        assertThatThrownBy(() -> organizationService.selectOrganization(orgId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User is not a member");

        verify(userWorkspaceStateRepository, never()).save(any());
    }

    @Test
    @DisplayName("selectOrganization throws EntityNotFoundException when organization does not exist")
    void selectOrganization_notFound_throwsEntityNotFoundException() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities()));

        when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> organizationService.selectOrganization(orgId))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
