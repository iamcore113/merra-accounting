package org.merra.services;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

import org.merra.dto.UserProfileImageResponse;
import org.merra.entities.Organization;
import org.merra.entities.UserAccount;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.OrganizationMembersRepository;
import org.merra.repositories.UserAccountRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.merra.utilities.RedisKeys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

/**
 * Stores user profile images in S3-compatible object storage (SeaweedFS).
 * The object key is persisted in the {@code user_account.profile_url} column.
 */
@Service
public class UserProfileImageService {

	private static final Logger logger = LoggerFactory.getLogger(UserProfileImageService.class);

	private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
	private static final Map<String, String> ALLOWED_TYPES = Map.of(
			"image/png", "png",
			"image/jpeg", "jpg",
			"image/webp", "webp");

	private final S3Client s3Client;
	private final UserAccountService userAccountService;
	private final UserAccountRepository userAccountRepository;
	private final UserWorkspaceStateRepository userWorkspaceStateRepository;
	private final OrganizationMembersRepository organizationMembersRepository;
	private final RedisTemplate<String, Object> redisTemplate;
	private final String bucket;
	private volatile boolean bucketChecked;

	public UserProfileImageService(
			S3Client s3Client,
			UserAccountService userAccountService,
			UserAccountRepository userAccountRepository,
			@Autowired(required = false) UserWorkspaceStateRepository userWorkspaceStateRepository,
			@Autowired(required = false) OrganizationMembersRepository organizationMembersRepository,
			@Autowired(required = false) RedisTemplate<String, Object> redisTemplate,
			@Value("${app.storage.user-bucket:merra-user}") String bucket) {
		this.s3Client = s3Client;
		this.userAccountService = userAccountService;
		this.userAccountRepository = userAccountRepository;
		this.userWorkspaceStateRepository = userWorkspaceStateRepository;
		this.organizationMembersRepository = organizationMembersRepository;
		this.redisTemplate = redisTemplate;
		this.bucket = bucket;
	}

	/** Image content with its content type, as read back from storage. */
	public record ProfileImage(byte[] content, String contentType) {
	}

	@Transactional
	public UserProfileImageResponse upload(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Image file is required.");
		}
		if (file.getSize() > MAX_SIZE_BYTES) {
			throw new IllegalArgumentException("Image must not exceed 5MB.");
		}
		final String contentType = file.getContentType();
		final String extension = contentType == null ? null : ALLOWED_TYPES.get(contentType.toLowerCase());
		if (extension == null) {
			throw new IllegalArgumentException("Unsupported image type. Allowed: PNG, JPEG, WEBP.");
		}

		UserAccount user = currentUser();
		ensureBucket();

		final String key = "users/" + user.getUserId() + "/profile/" + UUID.randomUUID() + "." + extension;
		try (InputStream in = file.getInputStream()) {
			s3Client.putObject(
					PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
					RequestBody.fromInputStream(in, file.getSize()));
		} catch (IOException e) {
			throw new IllegalStateException("Failed to read uploaded image.", e);
		}

		final String previousKey = user.getProfileUrl();
		user.setProfileUrl(key);
		userAccountRepository.save(user);
		evictPrincipalCache();

		deleteQuietly(previousKey);
		return new UserProfileImageResponse(key);
	}

	public ProfileImage download() {
		return read(currentUser());
	}

	/**
	 * Downloads the profile image of a user who belongs to the authenticated
	 * user's current organization.
	 */
	@Transactional(readOnly = true)
	public ProfileImage downloadForOrganizationMember(UUID userId) {
		if (userId == null) {
			throw new EntityNotFoundException("User not found.");
		}
		UserAccount current = currentUser();
		if (!userId.equals(current.getUserId())
				&& userWorkspaceStateRepository != null
				&& organizationMembersRepository != null) {
			Organization currentOrg = userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
					.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
			if (!organizationMembersRepository.isUserMemberOfOrganization(currentOrg.getId(), userId)) {
				throw new EntityNotFoundException("User is not a member of the current organization.");
			}
		}
		UserAccount targetUser = userAccountRepository.findById(userId)
				.orElseThrow(() -> new EntityNotFoundException("User entity " + userId + " not found."));
		return read(targetUser);
	}

	private ProfileImage read(UserAccount user) {
		final String key = user.getProfileUrl();
		if (key == null || key.isBlank()) {
			throw new EntityNotFoundException("User has no profile image.");
		}
		try {
			var response = s3Client.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build());
			return new ProfileImage(response.asByteArray(), response.response().contentType());
		} catch (NoSuchKeyException | NoSuchBucketException e) {
			throw new EntityNotFoundException("User profile image not found in storage.");
		}
	}

	@Transactional
	public void delete() {
		UserAccount user = currentUser();
		final String key = user.getProfileUrl();
		user.setProfileUrl(null);
		userAccountRepository.save(user);
		evictPrincipalCache();
		deleteQuietly(key);
	}

	private UserAccount currentUser() {
		return userAccountService.getCurrentAuthenticatedUser();
	}

	private void evictPrincipalCache() {
		if (redisTemplate == null) {
			return;
		}
		try {
			redisTemplate.delete(RedisKeys.PRINCIPAL);
		} catch (RuntimeException e) {
			logger.warn("Failed to evict principal cache after profile image update: {}", e.getMessage());
		}
	}

	private void ensureBucket() {
		if (bucketChecked) {
			return;
		}
		try {
			s3Client.headBucket(HeadBucketRequest.builder().bucket(bucket).build());
		} catch (NoSuchBucketException e) {
			s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
		} catch (S3Exception e) {
			if (e.statusCode() == 404) {
				s3Client.createBucket(CreateBucketRequest.builder().bucket(bucket).build());
			} else {
				throw e;
			}
		}
		bucketChecked = true;
	}

	private void deleteQuietly(String key) {
		if (key == null || key.isBlank()) {
			return;
		}
		try {
			s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
		} catch (RuntimeException e) {
			logger.warn("Failed to delete user profile image object '{}': {}", key, e.getMessage());
		}
	}
}
