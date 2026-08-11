package com.back.user.service.exception;

public class ResourceNotFoundException extends RuntimeException{
	
	public ResourceNotFoundException() {
		super("Resource not found exception!!!");
	}
	
	public ResourceNotFoundException(String message) {
		super(message);
	}
}
