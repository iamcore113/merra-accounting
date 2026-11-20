package org.merra.services;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Properties;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.merra.dto.AcceptInvitationResponse;
import org.merra.dto.CreateInvitationRequest;
import org.merra.dto.InvitationResponse;
import org.merra.dto.RegisterAndAcceptInvitationRequest;
import org.merra.dto.VerifyInvitationResponse;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationMembers;
import org.merra.entities.OrganizationNetworkKey;
import org.merra.entities.UserAccount;
import org.merra.entities.UserWorkspaceState;
import org.merra.repositories.OrganizationMembersRepository;
import org.merra.repositories.OrganizationNetworkKeyRepository;
import org.merra.repositories.UserAccountRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

class OrganizationInvitationServiceTest {

    private static final String TEST_SECRET = "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWYwMTIzNDU2Nzg5YWJjZGVm";

    private OrganizationNetworkKeyRepository networkKeyRepository;
    private UserWorkspaceStateRepository workspaceStateRepository;
    private OrganizationMembersRepository membersRepository;
    private UserAccountRepository userAccountRepository;
    private RedisTemplate<String, Object> redisTemplate;
    private JavaMailSender mailSender;
    private OrganizationInvitationService service;

    private Organization organization;
    private UserAccount adminUser;
    private UserAccount inviteeUser;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        networkKeyRepository = mock(OrganizationNetworkKeyRepository.class);
        workspaceStateRepository = mock(UserWorkspaceStateRepository.class);
        membersRepository = mock(OrganizationMembersRepository.class);
        userAccountRepository = mock(UserAccountRepository.class);
        redisTemplate = mock(RedisTemplate.class);
        mailSender = mock(JavaMailSender.class);

        service = new OrganizationInvitationService(
                networkKeyRepository,
                workspaceStateRepository,
                membersRepository,
                userAccountRepository,
                redisTemplate,
                mailSender
        );
        ReflectionTestUtils.setField(service, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:4200");
        ReflectionTestUtils.setField(service, "emailFrom", "noreply@merra.example");

        organization = new Organization();
        ReflectionTestUtils.setField(organization, "id", UUID.randomUUID());
        organization.setDisplayName("Acme Accounting");
        organization.setLegalName("Acme Accounting LLC");

        adminUser = new UserAccount("admin@acme.com", "secret");
        ReflectionTestUtils.setField(adminUser, "userId", UUID.randomUUID());

        inviteeUser = new UserAccount("invitee@example.com", "secret");
        ReflectionTestUtils.setField(inviteeUser, "userId", UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createInvitationWithEmailSendsMailAndPersistsInNetworkKeys() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(adminUser, null, adminUser.getAuthorities())
        );
        when(workspaceStateRepository.findCurrentOrganizationByPrincipal()).thenReturn(Optional.of(organization));
        when(membersRepository.save(any(OrganizationMembers.class))).thenAnswer(inv -> {
            OrganizationMembers m = inv.getArgument(0);
            if (m.getId() == null) {
                ReflectionTestUtils.setField(m, "id", UUID.randomUUID());
            }
            return m;
        });
        when(networkKeyRepository.save(any(OrganizationNetworkKey.class))).thenAnswer(inv -> {
            OrganizationNetworkKey k = inv.getArgument(0);
            ReflectionTestUtils.setField(k, "id", UUID.randomUUID());
            return k;
        });
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getDefaultInstance(new Properties())));

        InvitationResponse response = service.createInvitation(
                new CreateInvitationRequest("Invitee@Example.com", "STANDARD", true)
        );

        assertTrue(response.emailSent());
        assertEquals("invitee@example.com", response.inviteeEmail());
        assertEquals("STANDARD", response.role());
        assertEquals("Acme Accounting", response.organizationDisplayName());
        assertEquals("Acme Accounting LLC", response.organizationLegalName());
        assertTrue(response.invitationLink().startsWith("http://localhost:4200/join-organization?token="));
        verify(mailSender, times(1)).send(any(MimeMessage.class));
        verify(networkKeyRepository, times(1)).save(any(OrganizationNetworkKey.class));
    }

    @Test
    void verifyAndAcceptInvitationJoinsOrganizationAndDeactivatesToken() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(adminUser, null, adminUser.getAuthorities())
        );
        when(workspaceStateRepository.findCurrentOrganizationByPrincipal()).thenReturn(Optional.of(organization));
        when(membersRepository.save(any(OrganizationMembers.class))).thenAnswer(inv -> {
            OrganizationMembers m = inv.getArgument(0);
            if (m.getId() == null) {
                ReflectionTestUtils.setField(m, "id", UUID.randomUUID());
            }
            return m;
        });
        final OrganizationNetworkKey[] storedHolder = new OrganizationNetworkKey[1];
        when(networkKeyRepository.save(any(OrganizationNetworkKey.class))).thenAnswer(inv -> {
            OrganizationNetworkKey k = inv.getArgument(0);
            if (k.getId() == null) {
                ReflectionTestUtils.setField(k, "id", UUID.randomUUID());
            }
            storedHolder[0] = k;
            return k;
        });

        InvitationResponse created = service.createInvitation(
                new CreateInvitationRequest("invitee@example.com", "ADVISOR", false)
        );
        assertFalse(created.emailSent());
        verify(mailSender, never()).send(any(MimeMessage.class));

        when(networkKeyRepository.findByInvitationTokenAndIsActiveTrue(created.invitationToken()))
                .thenReturn(Optional.of(storedHolder[0]));
        when(userAccountRepository.findUserByEmailIgnoreCase("invitee@example.com"))
                .thenReturn(Optional.empty());

        VerifyInvitationResponse verified = service.verifyInvitationToken(created.invitationToken());
        assertTrue(verified.valid());
        assertEquals("invitee@example.com", verified.inviteeEmail());
        assertEquals("Acme Accounting", verified.organizationDisplayName());
        assertEquals("Acme Accounting LLC", verified.organizationLegalName());
        assertEquals("ADVISOR", verified.role());
        assertFalse(verified.accountExists());

        // Now accept as the invitee user
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(inviteeUser, null, inviteeUser.getAuthorities())
        );
        when(userAccountRepository.findById(inviteeUser.getUserId())).thenReturn(Optional.of(inviteeUser));
        when(membersRepository.isUserMemberOfOrganization(organization.getId(), inviteeUser.getUserId()))
                .thenReturn(false);
        when(workspaceStateRepository.findByUser(inviteeUser)).thenReturn(Optional.empty());

        AcceptInvitationResponse accepted = service.acceptInvitation(created.invitationToken());

        assertEquals(organization.getId(), accepted.organizationId());
        assertEquals("ADVISOR", accepted.role());
        assertTrue(inviteeUser.isPartOfOrganization());
        assertFalse(storedHolder[0].getIsActive());
        verify(membersRepository, times(2)).save(any(OrganizationMembers.class));
        verify(workspaceStateRepository, times(1)).save(any(UserWorkspaceState.class));
    }

    @Test
    void verifyExpiredOrInactiveInvitationReturnsInvalid() {
        OrganizationNetworkKey expired = new OrganizationNetworkKey();
        expired.setOrganization(organization);
        expired.setKeyType(OrganizationNetworkKey.TYPE_INVITATION);
        expired.setExpiresAt(LocalDateTime.now().minusHours(1));
        expired.setIsActive(Boolean.TRUE);

        VerifyInvitationResponse invalid = service.verifyInvitationToken("not-a-jwt");
        assertFalse(invalid.valid());
    }

    @Test
    void registerAndAcceptInvitationCreatesUserAndJoinsOrganization() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(adminUser, null, adminUser.getAuthorities())
        );
        when(workspaceStateRepository.findCurrentOrganizationByPrincipal()).thenReturn(Optional.of(organization));
        when(membersRepository.save(any(OrganizationMembers.class))).thenAnswer(inv -> {
            OrganizationMembers m = inv.getArgument(0);
            if (m.getId() == null) {
                ReflectionTestUtils.setField(m, "id", UUID.randomUUID());
            }
            return m;
        });
        final OrganizationNetworkKey[] storedHolder = new OrganizationNetworkKey[1];
        when(networkKeyRepository.save(any(OrganizationNetworkKey.class))).thenAnswer(inv -> {
            OrganizationNetworkKey k = inv.getArgument(0);
            if (k.getId() == null) {
                ReflectionTestUtils.setField(k, "id", UUID.randomUUID());
            }
            storedHolder[0] = k;
            return k;
        });

        InvitationResponse created = service.createInvitation(
                new CreateInvitationRequest("newinvitee@example.com", "STANDARD", false)
        );

        SecurityContextHolder.clearContext();
        when(networkKeyRepository.findByInvitationTokenAndIsActiveTrue(created.invitationToken()))
                .thenReturn(Optional.of(storedHolder[0]));
        when(userAccountRepository.findUserByEmailIgnoreCase("newinvitee@example.com"))
                .thenReturn(Optional.empty());
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(inv -> {
            UserAccount u = inv.getArgument(0);
            if (u.getUserId() == null) {
                ReflectionTestUtils.setField(u, "userId", UUID.randomUUID());
            }
            return u;
        });
        when(membersRepository.isUserMemberOfOrganization(any(UUID.class), any(UUID.class)))
                .thenReturn(false);
        when(workspaceStateRepository.findByUser(any(UserAccount.class)))
                .thenReturn(Optional.empty());
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getDefaultInstance(new Properties())));

        AcceptInvitationResponse result = service.registerAndAcceptInvitation(
                new RegisterAndAcceptInvitationRequest(
                        created.invitationToken(),
                        "newinvitee@example.com",
                        "Jane",
                        "Doe",
                        "female",
                        "Password123!"
                )
        );

        assertEquals(organization.getId(), result.organizationId());
        assertEquals("STANDARD", result.role());
        assertNotNull(result.accessToken());
        assertNotNull(result.refreshToken());
        assertFalse(storedHolder[0].getIsActive());
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void createInvitationRejectsEmailAlreadyInOrganization() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(adminUser, null, adminUser.getAuthorities())
        );
        when(workspaceStateRepository.findCurrentOrganizationByPrincipal()).thenReturn(Optional.of(organization));
        when(membersRepository.isEmailMemberOfOrganization(organization.getId(), "invitee@example.com"))
                .thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createInvitation(new CreateInvitationRequest("invitee@example.com", "STANDARD", true))
        );

        assertTrue(ex.getMessage().contains("already a member"));
        verify(networkKeyRepository, never()).save(any(OrganizationNetworkKey.class));
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
