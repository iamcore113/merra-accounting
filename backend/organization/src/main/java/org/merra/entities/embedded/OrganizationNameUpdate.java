package org.merra.entities.embedded;

import java.time.LocalDate;
import java.util.Map;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotNull;

@Embeddable
public class OrganizationNameUpdate {
	
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "former_name", columnDefinition = "jsonb")
	private Map<String, String> formerName;
	
	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "current_name", columnDefinition = "jsonb")
	private Map<String, String> currentName;
	
	@Column(name = "updated_date")
	@DateTimeFormat(iso = ISO.DATE)
	private LocalDate updatedDate;
	
	@Column(name = "is_updatable", nullable = false)
	@NotNull(message = "isUpdatable cannot be null.")
	private boolean isUpdatable = true;

	private String note;

	public OrganizationNameUpdate() {
	}

	public OrganizationNameUpdate(Map<String, String> formerName, Map<String, String> currentName,
			LocalDate updatedDate, @NotNull(message = "isUpdatable cannot be null.") boolean isUpdatable, String note) {
		this.formerName = formerName;
		this.currentName = currentName;
		this.updatedDate = updatedDate;
		this.isUpdatable = isUpdatable;
		this.note = note;
	}

	public Map<String, String> getFormerName() {
		return formerName;
	}

	public Map<String, String> getCurrentName() {
		return currentName;
	}

	public LocalDate getUpdatedDate() {
		return updatedDate;
	}

	public boolean isUpdatable() {
		return isUpdatable;
	}

	public String getNote() {
		return note;
	}

	public void setFormerName(Map<String, String> formerName) {
		this.formerName = formerName;
	}

	public void setCurrentName(Map<String, String> currentName) {
		this.currentName = currentName;
	}

	public void setUpdatedDate(LocalDate updatedDate) {
		this.updatedDate = updatedDate;
	}

	public void setUpdatable(boolean isUpdatable) {
		this.isUpdatable = isUpdatable;
	}

	public void setNote(String note) {
		this.note = note;
	}

	

}
