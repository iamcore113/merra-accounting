package org.merra.services;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Date;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import javax.crypto.SecretKey;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;

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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String INVITATION_TOKEN_TYPE = "ORGANIZATION_INVITATION";
    private static final Set<String> ALLOWED_ROLES = Set.of(
            UserAccountStatusEn.ADVISOR.name(),
            UserAccountStatusEn.STANDARD.name(),
            UserAccountStatusEn.INVOICE_ONLY.name(),
            UserAccountStatusEn.READ_ONLY.name(),
            UserAccountStatusEn.MEMBER.name()
    );
    private static final Pattern STRICT_EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,24}$"
    );
    private static final List<String> KNOWN_EMAIL_DOMAINS = List.of(
            "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
            "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com",
            "aol.com", "protonmail.com", "proton.me", "zoho.com", "gmx.com", "mail.com"
    );
    private static final Set<String> TEST_SAFE_DOMAINS = Set.of(
            "example.com", "example.org", "example.net", "acme.com", "merra.example", "localhost"
    );

    @Value("${token.secret}")
    private String jwtSecret;

    @Value("${token.access-token-duration:3600000}")
    private long accessTokenDuration = 3600000L;

    @Value("${token.refresh-token-duration:604800000}")
    private long refreshTokenDuration = 604800000L;

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
    private final PasswordEncoder passwordEncoder;
    private final UserAccountService userAccountService;

    public OrganizationInvitationService(
            OrganizationNetworkKeyRepository networkKeyRepository,
            UserWorkspaceStateRepository userWorkspaceStateRepository,
            OrganizationMembersRepository organizationMembersRepository,
            UserAccountRepository userAccountRepository,
            RedisTemplate<String, Object> redisTemplate,
            JavaMailSender mailSender) {
        this(networkKeyRepository, userWorkspaceStateRepository, organizationMembersRepository,
                userAccountRepository, redisTemplate, mailSender, null, null);
    }

    @Autowired
    public OrganizationInvitationService(
            OrganizationNetworkKeyRepository networkKeyRepository,
            UserWorkspaceStateRepository userWorkspaceStateRepository,
            OrganizationMembersRepository organizationMembersRepository,
            UserAccountRepository userAccountRepository,
            RedisTemplate<String, Object> redisTemplate,
            @Autowired(required = false) JavaMailSender mailSender,
            @Autowired(required = false) PasswordEncoder passwordEncoder,
            @Autowired(required = false) UserAccountService userAccountService) {
        this.networkKeyRepository = networkKeyRepository;
        this.userWorkspaceStateRepository = userWorkspaceStateRepository;
        this.organizationMembersRepository = organizationMembersRepository;
        this.userAccountRepository = userAccountRepository;
        this.redisTemplate = redisTemplate;
        this.mailSender = mailSender;
        this.passwordEncoder = passwordEncoder;
        this.userAccountService = userAccountService;
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

        String normalizedEmail = request.inviteeEmail() != null ? request.inviteeEmail().trim().toLowerCase() : "";
        validateInviteeEmail(normalizedEmail);
        String normalizedRole = normalizeAndValidateRole(request.role());

        if (isEmailAlreadyPartOfOrganization(currentOrg.getId(), normalizedEmail, inviter)) {
            throw new IllegalArgumentException(
                    "User with email " + normalizedEmail + " is already a member of " + currentOrg.getDisplayName() + "."
            );
        }

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
        String resolvedEmail = inviteeEmail != null ? inviteeEmail : (member != null ? member.getEmail() : null);
        if (resolvedEmail != null && isEmailAlreadyPartOfOrganization(org.getId(), resolvedEmail.trim(), null)) {
            return new VerifyInvitationResponse(
                    false,
                    "User with email " + resolvedEmail + " is already a member of " + org.getDisplayName() + ".",
                    resolvedEmail,
                    org.getId(),
                    org.getDisplayName(),
                    org.getLegalName(),
                    role != null ? role : (member != null ? member.getRole() : null),
                    record.getExpiresAt(),
                    true
            );
        }
        boolean accountExists = resolvedEmail != null
                && userAccountRepository.findUserByEmailIgnoreCase(resolvedEmail.trim()).isPresent();

        return new VerifyInvitationResponse(
                true,
                "Invitation token is valid.",
                resolvedEmail,
                org.getId(),
                org.getDisplayName(),
                org.getLegalName(),
                role != null ? role : (member != null ? member.getRole() : null),
                record.getExpiresAt(),
                accountExists
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
        if (organizationMembersRepository.isUserMemberOfOrganization(organization.getId(), user.getUserId())
                || isEmailAlreadyPartOfOrganization(organization.getId(), inviteeEmail, null)) {
            invitation.setIsActive(Boolean.FALSE);
            networkKeyRepository.save(invitation);
            throw new IllegalArgumentException(
                    "User with email " + inviteeEmail + " is already a member of " + organization.getDisplayName() + "."
            );
        }
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

    @Transactional
    public AcceptInvitationResponse registerAndAcceptInvitation(RegisterAndAcceptInvitationRequest request) {
        if (request == null || request.token() == null || request.token().isBlank()) {
            throw new IllegalArgumentException("Invitation token is required.");
        }

        String token = request.token().trim();
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

        OrganizationMembers memberRecord = invitation.getOrganizationMember();
        String inviteeEmail = claims.get("inviteeEmail", String.class);
        if ((inviteeEmail == null || inviteeEmail.isBlank()) && memberRecord != null) {
            inviteeEmail = memberRecord.getEmail();
        }
        if (inviteeEmail == null || !request.email().trim().equalsIgnoreCase(inviteeEmail.trim())) {
            throw new IllegalArgumentException("Email does not match the invited email address (" + inviteeEmail + ").");
        }

        String normalizedEmail = inviteeEmail.trim().toLowerCase();
        var existingUserOpt = userAccountRepository.findUserByEmailIgnoreCase(normalizedEmail);
        if (existingUserOpt.isPresent() && existingUserOpt.get().isEnabled()) {
            throw new IllegalArgumentException("An active MERRA account already exists for " + normalizedEmail + ". Please sign in to accept this invitation.");
        }

        Organization organization = invitation.getOrganization();
        if (isEmailAlreadyPartOfOrganization(organization.getId(), normalizedEmail, null)) {
            invitation.setIsActive(Boolean.FALSE);
            networkKeyRepository.save(invitation);
            throw new IllegalArgumentException(
                    "User with email " + normalizedEmail + " is already a member of " + organization.getDisplayName() + "."
            );
        }
        String role = normalizeAndValidateRole(
                claims.get("role", String.class) != null
                        ? claims.get("role", String.class)
                        : (memberRecord != null ? memberRecord.getRole() : null)
        );

        String encodedPassword = passwordEncoder != null
                ? passwordEncoder.encode(request.password())
                : request.password();

        UserAccount user = existingUserOpt.orElseGet(() -> new UserAccount(normalizedEmail, encodedPassword));
        user.setEmail(normalizedEmail);
        user.setAccountPassword(encodedPassword);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setGender(request.gender().trim().toLowerCase());
        user.setIsEnabled(false);
        user.setVerificationToken(null);
        user.setPartOfOrganization(true);
        user.setRoles(role);
        UserAccount savedUser = userAccountRepository.save(user);

        if (existingUserOpt.isEmpty() && userAccountService != null) {
            userAccountService.createUserAccountSetting(savedUser);
        }

        boolean alreadyMember = organizationMembersRepository.isUserMemberOfOrganization(organization.getId(), savedUser.getUserId());
        if (!alreadyMember) {
            OrganizationMembers member = memberRecord != null ? memberRecord : new OrganizationMembers();
            member.setOrganization(organization);
            member.setUser(savedUser);
            member.setEmail(normalizedEmail);
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

        UserWorkspaceState workspace = userWorkspaceStateRepository.findByUser(savedUser)
                .orElseGet(() -> new UserWorkspaceState(savedUser, organization));
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
            logger.warn("Failed to evict principal cache after registering and accepting invitation: {}", e.getMessage());
        }

        String accessToken = generateAuthJwtToken(savedUser.getEmail(), savedUser.getRoles(), accessTokenDuration, false);
        String refreshToken = generateAuthJwtToken(savedUser.getEmail(), savedUser.getRoles(), refreshTokenDuration, true);

        return new AcceptInvitationResponse(
                organization.getId(),
                organization.getDisplayName(),
                organization.getLegalName(),
                role,
                "Account created and joined " + organization.getDisplayName() + " as " + role + ".",
                accessToken,
                refreshToken
        );
    }

    private String generateAuthJwtToken(String userEmail, String role, long duration, boolean isRefreshToken) {
        long durationMs = (isRefreshToken && duration <= 365)
                ? duration * 24L * 60 * 60 * 1000L
                : duration;
        Date now = new Date();
        Date exp = new Date(now.getTime() + durationMs);
        return Jwts.builder()
                .claims(Map.of("role", role != null ? role : UserAccountStatusEn.MEMBER.name()))
                .subject(userEmail)
                .issuedAt(now)
                .expiration(exp)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    private void validateInviteeEmail(String email) {
        if (email == null || email.isBlank() || !STRICT_EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }
        int atIdx = email.lastIndexOf('@');
        String localPart = email.substring(0, atIdx);
        String domain = email.substring(atIdx + 1).toLowerCase();

        if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.contains("..") || domain.contains("..")) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }

        String suggestedDomain = findMisspelledProviderSuggestion(domain);
        if (suggestedDomain != null) {
            throw new IllegalArgumentException(
                    "Invalid email domain \"@" + domain + "\". Did you mean \"" + localPart + "@" + suggestedDomain + "\"?"
            );
        }

        if (!TEST_SAFE_DOMAINS.contains(domain) && !KNOWN_EMAIL_DOMAINS.contains(domain) && !hasValidMailDnsRecord(domain)) {
            throw new IllegalArgumentException(
                    "The email domain \"@" + domain + "\" does not exist or cannot receive emails. Please check the email address."
            );
        }
    }

    private String findMisspelledProviderSuggestion(String domain) {
        if (KNOWN_EMAIL_DOMAINS.contains(domain) || TEST_SAFE_DOMAINS.contains(domain)) {
            return null;
        }
        String collapsed = domain.replaceAll("(.)\\1+", "$1");
        for (String known : KNOWN_EMAIL_DOMAINS) {
            String knownCollapsed = known.replaceAll("(.)\\1+", "$1");
            if (collapsed.equals(knownCollapsed)) {
                return known;
            }
            int dist = levenshteinDistance(domain, known);
            if (dist >= 1 && dist <= 2) {
                return known;
            }
        }
        return null;
    }

    private int levenshteinDistance(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        for (int i = 0; i <= a.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= b.length(); j++) {
            dp[0][j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[a.length()][b.length()];
    }

    private boolean hasValidMailDnsRecord(String domain) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", "2000");
        env.put("com.sun.jndi.dns.timeout.retries", "1");
        try {
            DirContext ictx = new InitialDirContext(env);
            Attributes attrs = ictx.getAttributes(domain, new String[]{"MX", "A", "AAAA"});
            Attribute mx = attrs.get("MX");
            if (mx != null && mx.size() > 0) {
                return true;
            }
            Attribute a = attrs.get("A");
            if (a != null && a.size() > 0) {
                return true;
            }
            Attribute aaaa = attrs.get("AAAA");
            return aaaa != null && aaaa.size() > 0;
        } catch (NamingException e) {
            return false;
        }
    }

    private boolean isEmailAlreadyPartOfOrganization(UUID organizationId, String normalizedEmail, UserAccount inviter) {
        if (organizationId == null || normalizedEmail == null || normalizedEmail.isBlank()) {
            return false;
        }
        if (inviter != null && inviter.getEmail() != null && inviter.getEmail().trim().equalsIgnoreCase(normalizedEmail)) {
            return true;
        }
        if (organizationMembersRepository.isEmailMemberOfOrganization(organizationId, normalizedEmail)) {
            return true;
        }
        return userAccountRepository.findUserByEmailIgnoreCase(normalizedEmail)
                .filter(u -> u.getUserId() != null)
                .map(u -> organizationMembersRepository.isUserMemberOfOrganization(organizationId, u.getUserId()))
                .orElse(false);
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
                    <div style="font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;padding:32px 16px;">
                      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;">
                        <div style="background:#689d4b;padding:24px 32px;">
                          <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">MERRA</div>
                          <div style="color:#f4f8f1;font-size:13px;margin-top:4px;">Accounting Platform</div>
                        </div>
                        <div style="padding:32px;">
                          <h2 style="margin:0 0 12px 0;color:#1e293b;font-size:22px;font-weight:600;">You're invited to join an organization</h2>
                          <p style="margin:0 0 20px 0;color:#475569;font-size:15px;line-height:1.6;">
                            Hello, you have been invited to collaborate on <strong style="color:#1e293b;">%1$s</strong> in MERRA.
                            Review the details below and accept the invitation to get started.
                          </p>
                          <table role="presentation" style="width:100%%;border-collapse:collapse;border:1px solid #e2e8f0;margin:0 0 24px 0;font-size:14px;">
                            <tr>
                              <td style="padding:10px 14px;background:#f4f8f1;color:#64748b;font-weight:500;width:40%%;border-bottom:1px solid #e2e8f0;">Organization</td>
                              <td style="padding:10px 14px;color:#1e293b;font-weight:600;border-bottom:1px solid #e2e8f0;">%1$s</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 14px;background:#f4f8f1;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Legal name</td>
                              <td style="padding:10px 14px;color:#1e293b;font-weight:600;border-bottom:1px solid #e2e8f0;">%2$s</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 14px;background:#f4f8f1;color:#64748b;font-weight:500;border-bottom:1px solid #e2e8f0;">Your role</td>
                              <td style="padding:10px 14px;color:#1e293b;font-weight:600;border-bottom:1px solid #e2e8f0;">%3$s</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 14px;background:#f4f8f1;color:#64748b;font-weight:500;">Expires</td>
                              <td style="padding:10px 14px;color:#1e293b;font-weight:600;">24 hours after this email was sent</td>
                            </tr>
                          </table>
                          <div style="text-align:center;margin:28px 0;">
                            <a href="%4$s" style="display:inline-block;background:#689d4b;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border:1px solid #689d4b;">
                              Accept Invitation
                            </a>
                          </div>
                          <p style="margin:0 0 8px 0;color:#64748b;font-size:13px;line-height:1.5;">
                            Button not working? Go to the <strong>Enter Invitation Token</strong> page in MERRA and paste this token:
                          </p>
                          <div style="background:#f4f8f1;border:1px solid #689d4b;padding:10px 12px;font-family:monospace;font-size:12px;word-break:break-all;color:#1e293b;">
                            %5$s
                          </div>
                          <div style="margin:24px 0 0 0;padding:14px 16px;background:#fffbeb;border:1px solid #fcd34d;border-left:4px solid #f59e0b;">
                            <div style="color:#92400e;font-size:14px;font-weight:700;margin-bottom:6px;">Keep your token private</div>
                            <div style="color:#78350f;font-size:13px;line-height:1.6;">
                              This invitation token is personal and grants access to the organization.
                              <strong>Do not share it with anyone</strong>, including colleagues or MERRA support.
                              MERRA will never ask you for this token by phone, chat, or email.
                            </div>
                          </div>
                          <p style="margin:24px 0 0 0;color:#64748b;font-size:13px;line-height:1.6;">
                            Didn't expect this invitation? You can safely ignore this email and no changes will be made.
                            If the invitation expires, ask the organization administrator to send a new one.
                          </p>
                        </div>
                        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center;">
                          This is an automated message from MERRA. Please do not reply to this email.
                        </div>
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
