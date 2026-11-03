import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { AuthService } from './auth-service';
import { LocalStorageService } from './local-storage-service';
import { LOGOUT_URL } from '../api/auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let localStorageServiceSpy: jasmine.SpyObj<LocalStorageService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem', 'removeItem', 'clear']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should clear tokens and navigate to /account/signin on clearSessionAndRedirect', () => {
    service.clearSessionAndRedirect();

    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/account/signin']);
  });

  it('should send logout POST request with refresh token and clear session upon completion', () => {
    localStorageServiceSpy.getItem.and.callFake((key: string) => {
      if (key === 'refresh_token') return 'dummy-refresh-token';
      return null;
    });

    service.logout().subscribe();

    const req = httpMock.expectOne(LOGOUT_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'dummy-refresh-token' });

    req.flush({ success: true, message: 'Logout successful' });

    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/account/signin']);
  });

  it('should still clear session and navigate to /account/signin even if backend logout fails', () => {
    localStorageServiceSpy.getItem.and.returnValue('dummy-refresh-token');

    service.logout().subscribe();

    const req = httpMock.expectOne(LOGOUT_URL);
    req.flush('Error', { status: 500, statusText: 'Server Error' });

    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalledWith('refresh_token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/account/signin']);
  });
});
