package org.merra.entities.embedded;

import java.io.Serializable;
import java.util.Set;

import jakarta.validation.constraints.NotNull;

public class ExternalLinks implements Serializable {	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private static final Set<String> linkTypes = Set.of(
			"FACEBOOK",
			"INSTAGRAM",
			"WEBSITE",
			"TIKTOK"
	);
	
	@NotNull(message = "linkType attribute cannot be null.")
	private String linkType;
	@NotNull(message = "url attribute cannot be null.")
	private String url;
	
	public void setLinkType(String linkType) {
		if (!linkTypes.contains(linkType.toUpperCase())) {
			throw new IllegalArgumentException("Invalid key found: '" + linkType + "'. Allowed keys are: " + linkTypes);
		}else {
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

	public ExternalLinks(@NotNull(message = "linkType attribute cannot be null.") String linkType,
			@NotNull(message = "url attribute cannot be null.") String url) {
		this.linkType = linkType;
		this.url = url;
	}

	public ExternalLinks() {
	}

	
}
