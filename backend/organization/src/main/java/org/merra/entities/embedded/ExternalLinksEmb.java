package org.merra.entities.embedded;

import java.io.Serializable;
import java.util.Objects;
import java.util.Set;

import jakarta.validation.constraints.NotNull;

public class ExternalLinksEmb implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private static final Set<String> linkTypes = Set.of(
			"FACEBOOK",
			"X",
			"TWITTER",
			"INSTAGRAM",
			"LINKEDIN");

	@NotNull(message = "linkType attribute cannot be null.")
	private String linkType;
	@NotNull(message = "url attribute cannot be null.")
	private String url;

	public void setLinkType(String linkType) {
		if (linkType == null || !linkTypes.contains(linkType.toUpperCase())) {
			throw new IllegalArgumentException("Invalid key found: '" + linkType + "'. Allowed keys are: " + linkTypes);
		} else {
			this.linkType = linkType.toUpperCase();
		}
	}

	public String getLinkType() {
		return linkType;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public ExternalLinksEmb(@NotNull(message = "linkType attribute cannot be null.") String linkType,
			@NotNull(message = "url attribute cannot be null.") String url) {
		this.setLinkType(linkType);
		this.url = url;
	}

	public ExternalLinksEmb() {
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		ExternalLinksEmb that = (ExternalLinksEmb) o;
		return Objects.equals(linkType, that.linkType) && Objects.equals(url, that.url);
	}

	@Override
	public int hashCode() {
		return Objects.hash(linkType, url);
	}

}
