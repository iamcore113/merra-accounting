package org.merra.exception;

public class PhoneTypeNotFoundException extends RuntimeException {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	public PhoneTypeNotFoundException(String type) {
		super("Could not find phone type " + type);
	}

}
