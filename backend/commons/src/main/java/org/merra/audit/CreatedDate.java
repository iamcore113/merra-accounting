package org.merra.audit;

import java.time.Instant;

import jakarta.persistence.Embeddable;

@Embeddable
public class CreatedDate {
	@org.springframework.data.annotation.CreatedDate
	private Instant createdDate;

	public Instant getCreatedDate() {
		return createdDate;
	}

	public void setCreatedDate(Instant createdDate) {
		this.createdDate = createdDate;
	}

	
}
