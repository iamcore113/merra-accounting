import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { SelectOrganization } from './select-organization';
import { OrganizationService } from '../../shared/services/organization-service';
import { UserService } from '../../shared/services/user-service';
import { AuthService } from '../../shared/services/auth-service';

describe('SelectOrganization', () => {
  let component: SelectOrganization;
  let fixture: ComponentFixture<SelectOrganization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectOrganization],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        {
          provide: OrganizationService,
          useValue: {
            getUserOrganizationAffiliations: () =>
              of({
                success: true,
                data: {
                  count: 1,
                  organizations: [
                    {
                      organizationId: '11111111-1111-1111-1111-111111111111',
                      organizationName: 'Merra Accounting Co',
                      role: 'CREATOR',
                    },
                  ],
                },
              }),
            selectOrganization: () => of({ success: true }),
          },
        },
        {
          provide: UserService,
          useValue: {
            getAuthenticatedUserDetails: () =>
              of({
                success: true,
                data: {
                  fullName: 'Jane Doe',
                  email: 'jane@merra.com',
                },
              }),
          },
        },
        {
          provide: AuthService,
          useValue: {
            logout: () => of(undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and list the user organizations', () => {
    expect(component).toBeTruthy();
    expect(component.organizations().length).toBe(1);
    expect(component.organizations()[0].organizationName).toBe('Merra Accounting Co');
    expect(component.userName()).toBe('Jane Doe');
  });
});
