import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Signin } from './signin';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AuthService } from '../../shared/services/auth-service';
import { MessageService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';

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
});
