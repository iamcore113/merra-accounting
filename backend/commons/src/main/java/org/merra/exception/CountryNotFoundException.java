package org.merra.exception;

public class CountryNotFoundException extends RuntimeException {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public CountryNotFoundException(String country) {
		super("Could not find country " + country);
	}
}