package org.merra.api;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

import org.merra.exception.EmailAlreadyEnabledException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;

/**
 * Needs to test this especially the custom ones below
 */
@RestControllerAdvice
public class CustomRestExceptionHandler extends ResponseEntityExceptionHandler {

        /**
         * Will handle validation errors
         */
        @Override
        protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                        HttpHeaders headers, HttpStatusCode status, WebRequest request) {
                List<String> errors = new ArrayList<String>();
                for (FieldError error : ex.getBindingResult().getFieldErrors()) {
                        errors.add(error.getField() + ": " + error.getDefaultMessage());
                }
                for (ObjectError error : ex.getBindingResult().getGlobalErrors()) {
                        errors.add(error.getObjectName() + ": " + error.getDefaultMessage());
                }

                ApiError apiError = new ApiError(ex.getLocalizedMessage(), false, HttpStatus.BAD_REQUEST);
                return handleExceptionInternal(
                                ex, apiError, headers, apiError.getResponse(), request);
        }

        @Override
        protected ResponseEntity<Object> handleMissingServletRequestParameter(
                        MissingServletRequestParameterException ex, HttpHeaders headers, HttpStatusCode status,
                        WebRequest request) {

                ApiError apiError = new ApiError(ex.getLocalizedMessage(), false, HttpStatus.BAD_REQUEST);

                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        /**
         * Will report constraint violations
         * 
         * @param ex      - accepts {@linkplain ConstraintViolationException} object
         *                type
         * @param request - accepts {@linkplain WebRequest} object type
         * @return - {@linkplain ResponseEntity} object type.
         */
        @ExceptionHandler({ ConstraintViolationException.class })
        public ResponseEntity<Object> handleConstraintViolation(
                        ConstraintViolationException ex, WebRequest request) {
                List<String> errors = new ArrayList<String>();
                for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
                        errors.add(violation.getRootBeanClass().getName() + " " +
                                        violation.getPropertyPath() + ": " + violation.getMessage());
                }

                ApiError apiError = new ApiError(ex.getLocalizedMessage(), false, HttpStatus.BAD_REQUEST);
                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        @ExceptionHandler({ MethodArgumentTypeMismatchException.class })
        public ResponseEntity<Object> handleMethodArgumentTypeMismatch(
                        MethodArgumentTypeMismatchException ex, WebRequest request) {

                ApiError apiError = new ApiError(ex.getLocalizedMessage(), false, HttpStatus.BAD_REQUEST);
                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        @Override
        protected ResponseEntity<Object> handleNoHandlerFoundException(NoHandlerFoundException ex, HttpHeaders headers,
                        HttpStatusCode status, WebRequest request) {

                ApiError apiError = new ApiError(ex.getLocalizedMessage(), false, HttpStatus.NOT_FOUND);
                return new ResponseEntity<Object>(apiError, new HttpHeaders(), apiError.getResponse());
        }

        @Override
        protected ResponseEntity<Object> handleHttpRequestMethodNotSupported(
                        HttpRequestMethodNotSupportedException ex,
                        HttpHeaders headers,
                        HttpStatusCode status,
                        WebRequest request) {
                StringBuilder builder = new StringBuilder();
                builder.append(ex.getMethod());
                builder.append(
                                " method is not supported for this request. Supported methods are ");
                ex.getSupportedHttpMethods().forEach(t -> builder.append(t + " "));

                ApiError apiError = new ApiError(ex.getLocalizedMessage(), false, HttpStatus.METHOD_NOT_ALLOWED);
                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        @Override
        protected ResponseEntity<Object> handleHttpMediaTypeNotSupported(
                        HttpMediaTypeNotSupportedException ex,
                        HttpHeaders headers,
                        HttpStatusCode status,
                        WebRequest request) {
                StringBuilder builder = new StringBuilder();
                builder.append(ex.getContentType());
                builder.append(" media type is not supported. Supported media types are ");
                ex.getSupportedMediaTypes().forEach(t -> builder.append(t + ", "));

                ApiError apiError = new ApiError(ex.getLocalizedMessage(), false, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        /**
         * Fallback handler
         * 
         * @param ex      - accepts {@linkplain Exception} object type
         * @param request - {@linkplain WebRequest} object type
         * @return - {@linkplain ResponseEntity} object type
         */
        @ExceptionHandler({ Exception.class })
        public ResponseEntity<Object> handleAll(Exception ex, WebRequest request) {
                ApiError apiError = new ApiError(
                                ex.getLocalizedMessage(), false, HttpStatus.INTERNAL_SERVER_ERROR);
                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        /**
         * This is for not found entities
         * 
         * @param ex - accepts {@linkplain EntityNotFoundException} object type.
         * @return - {@linkplain ResponseEntity} type.
         */
        @ExceptionHandler({ EntityNotFoundException.class })
        public ResponseEntity<Object> entityNotFoundException(EntityNotFoundException ex) {
                ApiError apiError = new ApiError(
                                ex.getLocalizedMessage(), false, HttpStatus.NOT_FOUND);

                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        /**
         * This is for programs that will throw NoSuchElementException.
         * 
         * @param ex - accepts {@linkplain NoSuchElementException} object type.
         * @return - {@linkplain ResponseEntity} type.
         */
        @ExceptionHandler({ NoSuchElementException.class })
        public ResponseEntity<Object> elementNotFoundException(NoSuchElementException ex) {
                ApiError apiError = new ApiError(
                                ex.getLocalizedMessage(), false, HttpStatus.NOT_FOUND);

                return new ResponseEntity<Object>(
                                apiError, new HttpHeaders(), apiError.getResponse());
        }

        @ExceptionHandler({ BadCredentialsException.class })
        public ResponseEntity<Object> authenticationErrorException(BadCredentialsException ex) {
                ApiError apiError = new ApiError(
                                ex.getLocalizedMessage(), false, HttpStatus.BAD_REQUEST);

                return new ResponseEntity<Object>(
                                apiError,
                                new HttpHeaders(),
                                apiError.getResponse());
        }

        /**
         * This is used if an entity exists
         * 
         * @param ex - {EntityExistsException} object
         * @return - {ResponseEntity}
         */
        @ExceptionHandler({ EntityExistsException.class })
        public ResponseEntity<Object> entityExistsException(EntityExistsException ex) {
                ApiError apiError = new ApiError(
                                ex.getLocalizedMessage(), false, HttpStatus.CONFLICT);
                return new ResponseEntity<Object>(
                                apiError,
                                new HttpHeaders(),
                                apiError.getResponse());
        }

        @ExceptionHandler({ EmailAlreadyEnabledException.class })
        public ResponseEntity<Object> emailAlreadyEnabledException(EmailAlreadyEnabledException ex) {
                ApiError apiError = new ApiError(
                                ex.getLocalizedMessage(), false, HttpStatus.BAD_REQUEST);
                return new ResponseEntity<Object>(
                                apiError,
                                new HttpHeaders(),
                                apiError.getResponse());
        }

}
