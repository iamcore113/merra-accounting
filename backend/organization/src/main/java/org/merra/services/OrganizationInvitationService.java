package org.merra.services;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.merra.dto.AcceptInvitationResponse;
import org.merra.dto.CreateInvitationRequest;
import org.merra.dto.InvitationResponse;
import org.merra.dto.VerifyInvitationResponse;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationMembers;
import org.merra.entities.OrganizationNetworkKey;
import org.merra.entities.UserAccount;
import org.merra.entities.UserWorkspaceState;
import org.merra.enums.UserAccountStatusEn;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.OrganizationMembersRepository;
import org.merra.repositories.OrganizationNetworkKeyRepository;
import org.merra.repositories.UserAccountRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.utilities.RedisKeys;
import org.merra.utilities.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriComponentsBuilder;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityNotFoundException;

@Service
public class OrganizationInvitationService {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationInvitationService.class);
    public static final long INVITATION_DURATION_MS = 24L * 60 * 60 * 1000L;
    private static final String INVITATION_TOKEN_TYPE = "ORGANIZATION_INVITATION";
    private static final Set<String> ALLOWED_ROLES = Set.of(
            UserAccountStatusEn.ADVISOR.name(),
            UserAccountStatusEn.STANDARD.name(),
            UserAccountStatusEn.INVOICE_ONLY.name(),
            UserAccountStatusEn.READ_ONLY.name(),
            UserAccountStatusEn.MEMBER.name()
    );

    @Value("${token.secret}")
    private String jwtSecret;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Value("${spring.mail.username:noreply@merra.example}")
    private String emailFrom;

    private final OrganizationNetworkKeyRepository networkKeyRepository;
    private final UserWorkspaceStateRepository userWorkspaceStateRepository;
    private final OrganizationMembersRepository organizationMembersRepository;
    private final UserAccountRepository userAccountRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final JavaMailSender mailSender;

    public OrganizationInvitationService(
            OrganizationNetworkKeyRepository networkKeyRepository,
            UserWorkspaceStateRepository userWorkspaceStateRepository,
            OrganizationMembersRepository organizationMembersRepository,
            UserAccountRepository userAccountRepository,
            RedisTemplate<String, Object> redisTemplate,
            @Autowired(required = false) JavaMailSender mailSender) {
        this.networkKeyRepository = networkKeyRepository;
        this.userWorkspaceStateRepository = userWorkspaceStateRepository;
        this.organizationMembersRepository = organizationMembersRepository;
        this.userAccountRepository = userAccountRepository;
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
    }

    @Transactional
    public InvitationResponse createInvitation(CreateInvitationRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Invitation request cannot be null.");
        }

        Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
                .orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

        UserAccount inviter = SecurityUtils.getPrincipal(UserAccount.class)
                .orElseThrow(() -> new EntityNotFoundException("No authenticated user found."));

        String normalizedEmail = request.inviteeEmail().trim().toLowerCase();
        String normalizedRole = normalizeAndValidateRole(request.role());

        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + INVITATION_DURATION_MS);
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        Map<String, Object> claims = Map.of(
                "type", INVITATION_TOKEN_TYPE,
                "organizationId", currentOrg.getId().toString(),
                "organizationDisplayName", currentOrg.getDisplayName(),
                "organizationLegalName", currentOrg.getLegalName(),
                "inviteeEmail", normalizedEmail,
                "role", normalizedRole
        );

        String token = Jwts.builder()
                .claims(claims)
                .subject(normalizedEmail)
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();

        OrganizationMembers pendingMember = new OrganizationMembers();
        pendingMember.setOrganization(currentOrg);
        pendingMember.setUser(null);
        pendingMember.setEmail(normalizedEmail);
        pendingMember.setRole(normalizedRole);
        pendingMember.setIsCreator(Boolean.FALSE);
        pendingMember.setIsInvited(Boolean.TRUE);
        pendingMember.setInvitationBy(inviter);
        pendingMember.setInvitationDate(LocalDate.now());
        pendingMember.setStatus(UserAccountStatusEn.PENDING.name());
        OrganizationMembers savedMember = organizationMembersRepository.save(pendingMember);

        OrganizationNetworkKey record = new OrganizationNetworkKey();
        record.setOrganization(currentOrg);
        record.setKeyType(OrganizationNetworkKey.TYPE_INVITATION);
        record.setName("Invitation: " + normalizedEmail);
        record.setNetworkKey(token);
        record.setExpiresAt(expiresAt);
        record.setOrganizationMember(savedMember);
        record.setIsActive(Boolean.TRUE);

        OrganizationNetworkKey saved = networkKeyRepository.save(record);
        String invitationLink = buildInvitationLink(token);

        boolean emailSent = false;
        if (request.sendEmail()) {
            emailSent = sendInvitationEmail(
                    normalizedEmail,
                    currentOrg.getDisplayName(),
                    currentOrg.getLegalName(),
                    normalizedRole,
                    invitationLink,
                    token
            );
        }

        return toInvitationResponse(saved, currentOrg, savedMember, invitationLink, emailSent);
    }

    @Transactional(readOnly = true)
    public List<InvitationResponse> getOrganizationInvitations() {
        Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
                .orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

        LocalDateTime now = LocalDateTime.now();
        return networkKeyRepository.findActiveInvitationsByOrganizationId(currentOrg.getId())
                .stream()
                .filter(inv -> inv.getExpiresAt() == null || inv.getExpiresAt().isAfter(now))
                .map(inv -> toInvitationResponse(
                        inv,
                        inv.getOrganization(),
                        inv.getOrganizationMember(),
                        buildInvitationLink(inv.getNetworkKey()),
                        false))
                .toList();
    }

    @Transactional
    public void revokeInvitation(UUID invitationId) {
        if (invitationId == null) {
            throw new IllegalArgumentException("Invitation ID cannot be null.");
        }
        Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
                .orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

        OrganizationNetworkKey invitation = networkKeyRepository.findByIdAndOrganizationId(invitationId, currentOrg.getId())
                .filter(k -> OrganizationNetworkKey.TYPE_INVITATION.equals(k.getKeyType()))
                .orElseThrow(() -> new EntityNotFoundException("Invitation not found with ID: " + invitationId));

        OrganizationMembers pendingMember = invitation.getOrganizationMember();
        networkKeyRepository.delete(invitation);
        if (pendingMember != null && UserAccountStatusEn.PENDING.name().equals(pendingMember.getStatus())) {
            organizationMembersRepository.delete(pendingMember);
        }
    }

    @Transactional(readOnly = true)
    public VerifyInvitationResponse verifyInvitationToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return new VerifyInvitationResponse(false, "Invitation token is required.", null, null, null, null, null, null);
        }

        String token = rawToken.trim();
        Claims claims;
        try {
            claims = parseInvitationClaims(token);
        } catch (ExpiredJwtException e) {
            return new VerifyInvitationResponse(false, "Invitation token has expired (24-hour limit).", null, null, null, null, null, null);
        } catch (JwtException | IllegalArgumentException e) {
            return new VerifyInvitationResponse(false, "Invalid invitation token.", null, null, null, null, null, null);
        }

        String tokenType = claims.get("type", String.class);
        if (!INVITATION_TOKEN_TYPE.equals(tokenType)) {
            return new VerifyInvitationResponse(false, "Token is not a valid organization invitation token.", null, null, null, null, null, null);
        }

        var recordOpt = networkKeyRepository.findByInvitationTokenAndIsActiveTrue(token);
        if (recordOpt.isEmpty()) {
            return new VerifyInvitationResponse(false, "Invitation token is invalid, revoked, or already used.", null, null, null, null, null, null);
        }

        OrganizationNetworkKey record = recordOpt.get();
        if (record.getExpiresAt() != null && record.getExpiresAt().isBefore(LocalDateTime.now())) {
            return new VerifyInvitationResponse(false, "Invitation token has expired.", null, null, null, null, null, null);
        }

        Organization org = record.getOrganization();
        OrganizationMembers member = record.getOrganizationMember();
        String inviteeEmail = claims.get("inviteeEmail", String.class);
        String role = claims.get("role", String.class);

        return new VerifyInvitationResponse(
                true,
                "Invitation token is valid.",
                inviteeEmail != null ? inviteeEmail : (member != null ? member.getEmail() : null),
                org.getId(),
                org.getDisplayName(),
                org.getLegalName(),
                role != null ? role : (member != null ? member.getRole() : null),
                record.getExpiresAt()
        );
    }

    @Transactional
    public AcceptInvitationResponse acceptInvitation(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Invitation token is required.");
        }

        String token = rawToken.trim();
        Claims claims;
        try {
            claims = parseInvitationClaims(token);
        } catch (ExpiredJwtException e) {
            throw new IllegalArgumentException("Invitation token has expired.");
        } catch (JwtException e) {
            throw new IllegalArgumentException("Invalid invitation token.");
        }

        if (!INVITATION_TOKEN_TYPE.equals(claims.get("type", String.class))) {
            throw new IllegalArgumentException("Token is not a valid organization invitation.");
        }

        OrganizationNetworkKey invitation = networkKeyRepository.findByInvitationTokenAndIsActiveTrue(token)
                .orElseThrow(() -> new IllegalArgumentException("Invitation token is invalid, revoked, or already used."));

        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setIsActive(Boolean.FALSE);
            networkKeyRepository.save(invitation);
            throw new IllegalArgumentException("Invitation token has expired.");
        }

        UserAccount authenticatedUser = SecurityUtils.getPrincipal(UserAccount.class)
                .orElseThrow(() -> new EntityNotFoundException("No authenticated user found."));

        UserAccount user = userAccountRepository.findById(authenticatedUser.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user account not found."));

        String inviteeEmail = claims.get("inviteeEmail", String.class);
        if (inviteeEmail == null || !user.getEmail().equalsIgnoreCase(inviteeEmail)) {
            throw new IllegalArgumentException("This invitation was issued for " + inviteeEmail + " and cannot be accepted by " + user.getEmail() + ".");
        }

        Organization organization = invitation.getOrganization();
        OrganizationMembers memberRecord = invitation.getOrganizationMember();
        String role = normalizeAndValidateRole(
                claims.get("role", String.class) != null
                        ? claims.get("role", String.class)
                        : (memberRecord != null ? memberRecord.getRole() : null)
        );

        boolean alreadyMember = organizationMembersRepository.isUserMemberOfOrganization(organization.getId(), user.getUserId());
        if (!alreadyMember) {
            OrganizationMembers member = memberRecord != null ? memberRecord : new OrganizationMembers();
            member.setOrganization(organization);
            member.setUser(user);
            member.setEmail(inviteeEmail);
            member.setRole(role);
            member.setIsCreator(Boolean.FALSE);
            member.setIsInvited(Boolean.TRUE);
            if (member.getInvitationDate() == null) {
                member.setInvitationDate(invitation.getCreatedAt() != null
                        ? invitation.getCreatedAt().toLocalDate()
                        : LocalDate.now());
            }
            member.setStatus(UserAccountStatusEn.ACTIVE.name());
            member.setDateJoined(LocalDate.now());
            member.setDateUpdated(LocalDate.now());
            organizationMembersRepository.save(member);
        }

        user.setPartOfOrganization(true);
        user.setRoles(role);
        userAccountRepository.save(user);

        UserWorkspaceState workspace = userWorkspaceStateRepository.findByUser(user)
                .orElseGet(() -> new UserWorkspaceState(user, organization));
        workspace.setCurrentOrganization(organization);
        workspace.setLastActiveAt(OffsetDateTime.now());
        userWorkspaceStateRepository.save(workspace);

        invitation.setIsActive(Boolean.FALSE);
        networkKeyRepository.save(invitation);

        try {
            if (redisTemplate != null) {
                redisTemplate.delete(RedisKeys.PRINCIPAL);
            }
        } catch (Exception e) {
            logger.warn("Failed to evict principal cache after accepting invitation: {}", e.getMessage());
        }

        return new AcceptInvitationResponse(
                organization.getId(),
                organization.getDisplayName(),
                organization.getLegalName(),
                role,
                "Successfully joined " + organization.getDisplayName() + " as " + role + "."
        );
    }

    private String normalizeAndValidateRole(String role) {
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role cannot be blank.");
        }
        String normalized = role.trim().toUpperCase().replace("ROLE_", "");
        if (!ALLOWED_ROLES.contains(normalized)) {
            throw new IllegalArgumentException("Unsupported invitation role: " + role);
        }
        return normalized;
    }

    private Claims parseInvitationClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private String buildInvitationLink(String token) {
        if (token == null || token.isBlank()) {
            return "";
        }
        return UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/join-organization")
                .queryParam("token", token)
                .toUriString();
    }

    private boolean sendInvitationEmail(
            String toEmail,
            String displayName,
            String legalName,
            String role,
            String invitationLink,
            String token) {
        if (mailSender == null) {
            logger.warn("JavaMailSender is not configured; skipping invitation email to {}", toEmail);
            return false;
        }
        try {
            String subject = "You're invited to join " + displayName + " on MERRA";
            String html = """
                    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;padding:32px 16px;">
                      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
                        <h2 style="margin:0 0 12px 0;color:#0f172a;font-size:22px;">Organization Invitation</h2>
                        <p style="margin:0 0 16px 0;color:#475569;font-size:15px;line-height:1.6;">
                          You have been invited to join <strong>%s</strong> (%s) on MERRA with the role <strong>%s</strong>.
                        </p>
                        <div style="text-align:center;margin:28px 0;">
                          <a href="%s" style="display:inline-block;background:#0284c7;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px;">
                            Accept Invitation
                          </a>
                        </div>
                        <p style="margin:0 0 8px 0;color:#64748b;font-size:13px;">
                          Or paste this invitation token on the Enter Invitation Token page:
                        </p>
                        <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:6px;padding:10px 12px;font-family:monospace;font-size:12px;word-break:break-all;color:#0f172a;">
                          %s
                        </div>
                        <p style="margin:20px 0 0 0;color:#94a3b8;font-size:12px;">
                          This invitation expires in 24 hours.
                        </p>
                      </div>
                    </div>
                    """.formatted(displayName, legalName, role, invitationLink, token);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            helper.setTo(toEmail);
            helper.setFrom(emailFrom);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(mimeMessage);
            return true;
        } catch (MessagingException | MailException e) {
            logger.error("Failed to send invitation email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private InvitationResponse toInvitationResponse(
            OrganizationNetworkKey k,
            Organization org,
            OrganizationMembers member,
            String invitationLink,
            boolean emailSent) {
        return new InvitationResponse(
                k.getId(),
                org.getId(),
                org.getDisplayName(),
                org.getLegalName(),
                member != null ? member.getEmail() : null,
                member != null ? member.getRole() : null,
                k.getNetworkKey(),
                invitationLink,
                emailSent,
                Boolean.TRUE.equals(k.getIsActive()),
                k.getExpiresAt(),
                k.getCreatedAt()
        );
    }
}
