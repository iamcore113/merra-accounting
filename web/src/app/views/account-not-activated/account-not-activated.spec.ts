import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';
import { AccountNotActivated } from './account-not-activated';
import { AuthService } from '../../shared/services/auth-service';
import { LocalStorageService } from '../../shared/services/local-storage-service';

describe('AccountNotActivated', () => {
  let component: AccountNotActivated;
  let fixture: ComponentFixture<AccountNotActivated>;
  let router: Router;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let localStorageSpy: jasmine.SpyObj<LocalStorageService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['resendVerificationEmail']);
    localStorageSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem', 'removeItem']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [AccountNotActivated],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LocalStorageService, useValue: localStorageSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'email' ? 'unverified@merra.example' : null),
              },
              queryParamMap: {
                get: (key: string) => (key === 'email' ? 'unverified@merra.example' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountNotActivated);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create and display email', () => {
    expect(component).toBeTruthy();
    expect(component.email).toBe('unverified@merra.example');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.auth-title')?.textContent).toContain('Account Not Activated');
    expect(compiled.querySelector('.email-highlight')?.textContent).toContain('unverified@merra.example');
  });

  it('should resend PIN code and navigate to verify-email on proceedToPinActivation', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(
      of({
        success: true,
        message: 'Verification email resent.',
        response: 'OK',
        data: {
          resent: true,
          verificationToken: { token: 'jwt-pin-token' },
          userDetail: { userId: 'uid-456', email: 'unverified@merra.example' },
        },
      } as any)
    );

    component.proceedToPinActivation();

    expect(authServiceSpy.resendVerificationEmail).toHaveBeenCalledWith({
      email: 'unverified@merra.example',
    });
    expect(localStorageSpy.setItem).toHaveBeenCalledWith('pendingVerificationUserId', 'uid-456');
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/account/verify-email', 'unverified@merra.example'],
      { queryParams: { uid: 'uid-456' } }
    );
  });

  it('should still navigate to verify-email if resend fails with non-activated error', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    authServiceSpy.resendVerificationEmail.and.returnValue(
      throwError(() => ({ error: { message: 'Mail server temporarily unavailable' } }))
    );

    component.proceedToPinActivation();

    expect(navigateSpy).toHaveBeenCalledWith(['/account/verify-email', 'unverified@merra.example']);
  });

  it('should navigate back to signin with email on backToSignin', () => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.backToSignin();

    expect(navigateSpy).toHaveBeenCalledWith(['/account/signin'], {
      queryParams: { email: 'unverified@merra.example' },
      state: { email: 'unverified@merra.example' },
    });
  });
});
