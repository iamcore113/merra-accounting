package org.merra.services;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

import org.merra.dto.OrganizationProfileImageResponse;
import org.merra.entities.Organization;
import org.merra.exceptions.OrganizationExceptions;
import org.merra.repositories.OrganizationRepository;
import org.merra.repositories.UserWorkspaceStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.EntityNotFoundException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

/**
 * Stores organization profile images in S3-compatible object storage
 * (SeaweedFS). The object key is persisted in the
 * {@code organization.profile_image} column.
 */
@Service
public class OrganizationProfileImageService {

	private static final Logger logger = LoggerFactory.getLogger(OrganizationProfileImageService.class);

	private static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
	private static final Map<String, String> ALLOWED_TYPES = Map.of(
			"image/png", "png",
			"image/jpeg", "jpg",
			"image/webp", "webp");

	private final S3Client s3Client;
	private final OrganizationRepository organizationRepository;
	private final UserWorkspaceStateRepository userWorkspaceStateRepository;
	private final String bucket;
	private volatile boolean bucketChecked;

	public OrganizationProfileImageService(
			S3Client s3Client,
			OrganizationRepository organizationRepository,
			UserWorkspaceStateRepository userWorkspaceStateRepository,
			@Value("${app.storage.organization-bucket:merra-organization}") String bucket) {
		this.s3Client = s3Client;
		this.organizationRepository = organizationRepository;
		this.userWorkspaceStateRepository = userWorkspaceStateRepository;
		this.bucket = bucket;
	}

	/** Image content with its content type, as read back from storage. */
	public record ProfileImage(byte[] content, String contentType) {
	}

	@Transactional
	public OrganizationProfileImageResponse upload(MultipartFile file) {
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

		Organization organization = currentOrganization();
		ensureBucket();

		final String key = "organizations/" + organization.getId() + "/profile/" + UUID.randomUUID() + "." + extension;
		try (InputStream in = file.getInputStream()) {
			s3Client.putObject(
					PutObjectRequest.builder().bucket(bucket).key(key).contentType(contentType).build(),
					RequestBody.fromInputStream(in, file.getSize()));
		} catch (IOException e) {
			throw new IllegalStateException("Failed to read uploaded image.", e);
		}

		final String previousKey = organization.getLogo();
		organization.setLogo(key);
		organizationRepository.save(organization);

		deleteQuietly(previousKey);
		return new OrganizationProfileImageResponse(key);
	}

	public ProfileImage download() {
		Organization organization = currentOrganization();
		final String key = organization.getLogo();
		if (key == null || key.isBlank()) {
			throw new EntityNotFoundException("Organization has no profile image.");
		}
		try {
			var response = s3Client.getObjectAsBytes(GetObjectRequest.builder().bucket(bucket).key(key).build());
			return new ProfileImage(response.asByteArray(), response.response().contentType());
		} catch (NoSuchKeyException | NoSuchBucketException e) {
			throw new EntityNotFoundException("Organization profile image not found in storage.");
		}
	}

	@Transactional
	public void delete() {
		Organization organization = currentOrganization();
		final String key = organization.getLogo();
		organization.setLogo(null);
		organizationRepository.save(organization);
		deleteQuietly(key);
	}

	private Organization currentOrganization() {
		return userWorkspaceStateRepository.findCurrentOrganizationByPrincipal()
				.orElseThrow(() -> new EntityNotFoundException(OrganizationExceptions.NOT_FOUND_CURRENT_ORGANIZATION));
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
			logger.warn("Failed to delete profile image object '{}': {}", key, e.getMessage());
		}
	}
}
