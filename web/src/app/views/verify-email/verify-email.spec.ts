import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { VerifyEmail } from './verify-email';
import { AuthService } from '../../shared/services/auth-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';

describe('VerifyEmail', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let localStorageSpy: jasmine.SpyObj<LocalStorageService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'checkVerificationStatus',
      'verifyPin',
      'resendVerificationEmail',
    ]);
    localStorageSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem', 'removeItem']);

    localStorageSpy.getItem.and.returnValue(null);
    authServiceSpy.checkVerificationStatus.and.returnValue(
      of({
        success: true,
        message: 'ok',
        response: 'OK',
        data: {
          exists: true,
          isVerified: false,
          isPendingVerification: true,
        },
      } as any)
    );

    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [
        provideRouter([]),
        MessageService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LocalStorageService, useValue: localStorageSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ email: 'user@merra.example' }),
              queryParamMap: convertToParamMap({ uid: '123' }),
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display Enter PIN code to activate your account heading', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.auth-title')?.textContent).toContain(
      'Enter PIN code to activate your account'
    );
  });

  it('should submit 4-digit PIN and navigate to personal details on success', () => {
    authServiceSpy.verifyPin.and.returnValue(
      of({
        success: true,
        message: 'Activated',
        response: 'CREATED',
        data: {
          isVerified: true,
          userId: '123',
          email: 'user@merra.example',
          accessToken: 'token-abc',
        },
      } as any)
    );

    component.pinDigits.set(['4', '8', '2', '9']);
    expect(component.isPinComplete()).toBeTrue();

    component.onSubmitPin();

    expect(authServiceSpy.verifyPin).toHaveBeenCalledWith({
      email: 'user@merra.example',
      pin: '4829',
    });
    expect(localStorageSpy.setItem).toHaveBeenCalledWith('access_token', 'token-abc');
    expect(localStorageSpy.removeItem).toHaveBeenCalledWith('pendingVerificationUserId');
    expect(router.navigate).toHaveBeenCalledWith([
      'account/personal-details',
      'user@merra.example',
    ]);
  });

  it('should skip personal-details and navigate to main/entering-workspace when profile is already complete and part of organization', () => {
    authServiceSpy.verifyPin.and.returnValue(
      of({
        success: true,
        message: 'Activated',
        response: 'CREATED',
        data: {
          isVerified: true,
          userId: '123',
          email: 'user@merra.example',
          accessToken: 'token-abc',
          refreshToken: 'refresh-xyz',
          isProfileComplete: true,
          partOfOrganization: true,
          hasActiveWorkspace: true,
        },
      } as any)
    );

    component.pinDigits.set(['4', '8', '2', '9']);
    component.onSubmitPin();

    expect(localStorageSpy.setItem).toHaveBeenCalledWith('access_token', 'token-abc');
    expect(localStorageSpy.setItem).toHaveBeenCalledWith('refresh_token', 'refresh-xyz');
    expect(router.navigate).toHaveBeenCalledWith(['/entering-workspace']);
  });

  it('should skip personal-details and navigate to /main/organization when profile is complete and part of organization without active workspace flag', () => {
    authServiceSpy.verifyPin.and.returnValue(
      of({
        success: true,
        message: 'Activated',
        response: 'CREATED',
        data: {
          isVerified: true,
          userId: '123',
          email: 'user@merra.example',
          accessToken: 'token-abc',
          isProfileComplete: true,
          partOfOrganization: true,
          hasActiveWorkspace: false,
        },
      } as any)
    );

    component.pinDigits.set(['4', '8', '2', '9']);
    component.onSubmitPin();

    expect(router.navigate).toHaveBeenCalledWith(['/main/organization']);
  });
});
