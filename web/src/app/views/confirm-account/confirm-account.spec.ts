import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmAccount } from './confirm-account';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

describe('ConfirmAccount', () => {
  let component: ConfirmAccount;
  let fixture: ComponentFixture<ConfirmAccount>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmAccount],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'email' ? 'test@example.com' : null),
              },
              queryParamMap: {
                get: (key: string) => (key === 'email' ? 'test@example.com' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmAccount);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate email from route param/query param', () => {
    expect(component.email).toBe('test@example.com');
  });

  it('should navigate to signin with email queryParam on confirmOwnership', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.confirmOwnership();
    expect(navigateSpy).toHaveBeenCalledWith(['/account/signin'], {
      queryParams: { email: 'test@example.com' },
      state: { email: 'test@example.com' },
    });
  });

  it('should navigate to signup on useDifferentEmail', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.useDifferentEmail();
    expect(navigateSpy).toHaveBeenCalledWith(['/account/signup']);
  });
});
