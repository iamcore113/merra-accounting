import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signup } from './signup';
import { AuthService } from '../../shared/services/auth-service';
import { MessageService } from 'primeng/api';
import { Router, provideRouter } from '@angular/router';
import { throwError } from 'rxjs';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['signup']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect to account/confirm-account when email already exists error is returned', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.signupForm.patchValue({
      email: 'existing@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      gender: 'male',
      agreeToTerms: true,
    });

    authServiceSpy.signup.and.returnValue(
      throwError(() => ({
        status: 400,
        error: {
          message: 'Email already exists.',
          success: false,
          response: 'BAD_REQUEST',
        },
      }))
    );

    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(['account/confirm-account'], {
      queryParams: { email: 'existing@example.com' },
      state: { email: 'existing@example.com' },
    });
    expect(messageServiceSpy.add).not.toHaveBeenCalled();
  });

  it('should show error toast when signup fails with other error', () => {
    const navigateSpy = spyOn(router, 'navigate');

    component.signupForm.patchValue({
      email: 'valid@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      gender: 'male',
      agreeToTerms: true,
    });

    authServiceSpy.signup.and.returnValue(
      throwError(() => ({
        status: 500,
        error: {
          message: 'Internal server error',
        },
      }))
    );

    component.onSubmit();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'error',
        summary: 'Signup Failed',
        detail: 'Internal server error',
      })
    );
  });
});
