package org.merra.services;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

import org.merra.dto.NetworkKeyResponse;
import org.merra.dto.ResolveNetworkKeyResponse;
import org.merra.entities.Contact;
import org.merra.entities.Organization;
import org.merra.entities.OrganizationNetworkKey;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.OrganizationNetworkKeyRepository;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;

@Service
public class NetworkKeyService {

    private static final String KEY_PREFIX = "mrk_live_";
    private static final String ALPHANUMERIC = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final OrganizationNetworkKeyRepository networkKeyRepository;
    private final OrganizationRepository organizationRepository;
    private final UserWorkspaceStateRepository userWorkspaceStateRepository;

    public NetworkKeyService(
            OrganizationNetworkKeyRepository networkKeyRepository,
            OrganizationRepository organizationRepository,
            UserWorkspaceStateRepository userWorkspaceStateRepository) {
        this.networkKeyRepository = networkKeyRepository;
        this.organizationRepository = organizationRepository;
        this.userWorkspaceStateRepository = userWorkspaceStateRepository;
    }

    @Transactional
    public NetworkKeyResponse generateNetworkKey(String name) {
        Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
                .orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

        String key;
        do {
            key = generateSecureToken();
        } while (networkKeyRepository.findByNetworkKey(key).isPresent());

        String keyName = (name != null && !name.isBlank()) ? name.trim() : "Primary Network Key";
        OrganizationNetworkKey networkKey = new OrganizationNetworkKey(currentOrg, key, keyName);
        OrganizationNetworkKey saved = networkKeyRepository.save(networkKey);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<NetworkKeyResponse> getOrganizationKeys() {
        Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
                .orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

        return networkKeyRepository.findActiveKeysByOrganizationId(currentOrg.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void deleteNetworkKey(UUID keyId) {
        if (keyId == null) {
            throw new IllegalArgumentException("Key ID cannot be null");
        }
        Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
                .orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));

        OrganizationNetworkKey key = networkKeyRepository.findByIdAndOrganizationId(keyId, currentOrg.getId())
                .orElseThrow(() -> new EntityNotFoundException("Network key not found with ID: " + keyId));

        networkKeyRepository.delete(key);
    }

    @Transactional(readOnly = true)
    public ResolveNetworkKeyResponse resolveNetworkKey(String keyString) {
        if (keyString == null || keyString.isBlank()) {
            return new ResolveNetworkKeyResponse(false, null, null, null, null, null, "Network key is required");
        }

        String cleanedKey = keyString.trim();
        Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal().orElse(null);

        var keyOptional = networkKeyRepository.findByNetworkKeyAndIsActiveTrue(cleanedKey);
        if (keyOptional.isEmpty()) {
            return new ResolveNetworkKeyResponse(false, null, null, null, null, null, "Invalid or inactive Merra Network Key");
        }

        OrganizationNetworkKey key = keyOptional.get();
        Organization ownerOrg = key.getOrganization();

        if (currentOrg != null && currentOrg.getId().equals(ownerOrg.getId())) {
            return new ResolveNetworkKeyResponse(false, null, null, null, null, null, "Cannot connect to your own organization's Network Key");
        }

        String currencyCode = ownerOrg.getDefaultCurrency() != null ? ownerOrg.getDefaultCurrency().getCode() : null;
        return new ResolveNetworkKeyResponse(
                true,
                ownerOrg.getId(),
                ownerOrg.getDisplayName(),
                ownerOrg.getLegalName(),
                ownerOrg.getCountry(),
                currencyCode,
                "Valid Merra Network Key"
        );
    }

    @Transactional(readOnly = true)
    public void validateSubscription(Contact contact) {
        if (contact == null) return;
        if (!Boolean.TRUE.equals(contact.getIsTenant())) return;

        if (contact.getCounterParty() == null || contact.getCounterpartyKey() == null || contact.getCounterpartyKey().isBlank()) {
            throw new IllegalStateException("Contact is marked as a network tenant but has no linked counterparty organization or network key.");
        }

        boolean active = networkKeyRepository.existsActiveKeyForOrganization(
                contact.getCounterParty().getId(),
                contact.getCounterpartyKey().trim()
        );

        if (!active) {
            throw new IllegalStateException(
                    "Cannot process transaction: Counterparty organization '" + contact.getName()
                            + "' has revoked or deleted their Merra Network Key. Transactions cannot proceed without an active subscription key."
            );
        }
    }

    private String generateSecureToken() {
        StringBuilder sb = new StringBuilder(KEY_PREFIX);
        for (int i = 0; i < 32; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }

    private NetworkKeyResponse toResponse(OrganizationNetworkKey k) {
        return new NetworkKeyResponse(
                k.getId(),
                k.getOrganization().getId(),
                k.getNetworkKey(),
                k.getName(),
                k.getIsActive(),
                k.getCreatedAt()
        );
    }
}
