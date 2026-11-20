import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { MainProfile } from './main-profile';
import { AuthService } from '../../../shared/services/auth-service';
import { UserService } from '../../../shared/services/user-service';
import { OrganizationService } from '../../../shared/services/organization-service';
import { UtilityService } from '../../../shared/services/utility-service';

describe('MainProfile', () => {
  let component: MainProfile;
  let fixture: ComponentFixture<MainProfile>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogServiceSpy: jasmine.SpyObj<DialogService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let organizationServiceSpy: jasmine.SpyObj<OrganizationService>;
  let utilityServiceSpy: jasmine.SpyObj<UtilityService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    dialogServiceSpy = jasmine.createSpyObj('DialogService', ['open']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAuthenticatedUserDetails', 'isAccountUnverified', 'setAccountUnverified']);
    userServiceSpy.getAuthenticatedUserDetails.and.returnValue(of({ success: true, data: {} } as any));
    userServiceSpy.isAccountUnverified.and.returnValue(false);
    organizationServiceSpy = jasmine.createSpyObj('OrganizationService', ['getCurrentOrganization']);
    organizationServiceSpy.getCurrentOrganization.and.returnValue(of({ success: true, data: {} } as any));
    utilityServiceSpy = jasmine.createSpyObj('UtilityService', ['getCountries']);
    utilityServiceSpy.getCountries.and.returnValue(of({ success: true, data: [] } as any));

    await TestBed.configureTestingModule({
      imports: [MainProfile],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: DialogService, useValue: dialogServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: OrganizationService, useValue: organizationServiceSpy },
        { provide: UtilityService, useValue: utilityServiceSpy },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open confirmation dialog on logout click', () => {
    dialogServiceSpy.open.and.returnValue({
      onClose: { subscribe: jasmine.createSpy('subscribe') }
    } as any);

    component.onLogout();
    expect(dialogServiceSpy.open).toHaveBeenCalled();
  });

  it('should render skeleton loading placeholders when isLoading is true', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const nativeEl: HTMLElement = fixture.nativeElement;
    expect(nativeEl.querySelectorAll('p-skeleton').length).toBeGreaterThan(0);
    expect(nativeEl.querySelectorAll('.skeleton-affiliated-item').length).toBe(2);
    expect(nativeEl.querySelector('.affiliated-empty-state')).toBeNull();
  });
});
