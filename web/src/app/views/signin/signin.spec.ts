import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Signin } from './signin';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { AuthService } from '../../shared/services/auth-service';
import { MessageService } from 'primeng/api';
import { BehaviorSubject, throwError } from 'rxjs';

describe('Signin', () => {
  let component: Signin;
  let fixture: ComponentFixture<Signin>;
  let queryParamsSubject: BehaviorSubject<Record<string, any>>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    queryParamsSubject = new BehaviorSubject<Record<string, any>>({});
    authServiceSpy = jasmine.createSpyObj('AuthService', ['signin']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [Signin],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable(),
          },
        },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Signin);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should prefill email when email query param is present', fakeAsync(() => {
    queryParamsSubject.next({ email: 'owner@example.com' });
    fixture.detectChanges();
    tick(200);

    expect(component.signinForm.get('email')?.value).toBe('owner@example.com');
  }));

  it('should keep password field empty when email is prefilled', fakeAsync(() => {
    queryParamsSubject.next({ email: 'owner@example.com' });
    fixture.detectChanges();
    tick(200);

    expect(component.signinForm.get('email')?.value).toBe('owner@example.com');
    expect(component.signinForm.get('password')?.value).toBe('');
    expect(component.signinForm.valid).toBeFalse();
  }));

  it('should redirect to /account/not-activated/:email when account is not activated (403)', () => {
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    authServiceSpy.signin.and.returnValue(
      throwError(() => ({
        status: 403,
        error: {
          message: 'Account is not yet activated. Please verify your email using the 4-digit PIN code.',
        },
      }))
    );

    component.signinForm.setValue({
      email: 'unverified@merra.example',
      password: 'ValidPassword1!',
    });

    component.onSubmit();

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/account/not-activated', 'unverified@merra.example'],
      {
        queryParams: { email: 'unverified@merra.example' },
        state: { email: 'unverified@merra.example' },
      }
    );
    expect(messageServiceSpy.add).not.toHaveBeenCalled();
  });
});
