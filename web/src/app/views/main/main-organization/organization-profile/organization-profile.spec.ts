import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { OrganizationProfile } from './organization-profile';
import { OrganizationService } from '../../../../shared/services/organization-service';
import { NetworkKeyService } from '../../../../shared/services/network-key-service';
import { InvitationService } from '../../../../shared/services/invitation-service';
import { UtilityService } from '../../../../shared/services/utility-service';

describe('OrganizationProfile', () => {
  let component: OrganizationProfile;
  let fixture: ComponentFixture<OrganizationProfile>;
  let organizationServiceSpy: jasmine.SpyObj<OrganizationService>;
  let networkKeyServiceSpy: jasmine.SpyObj<NetworkKeyService>;
  let invitationServiceSpy: jasmine.SpyObj<InvitationService>;
  let utilityServiceSpy: jasmine.SpyObj<UtilityService>;

  const mockOrgResponse = {
    message: 'Success',
    success: true,
    response: 200,
    data: {
      organizationId: 'org-test-uuid',
      organizationType: { typeId: 'type-1', name: 'COMPANY' },
      names: { displayName: 'Merra Solutions', legalName: 'Merra Solutions Inc.', description: 'Cloud accounting services.' },
      address: {
        email: 'contact@merra.com',
        country: 'US',
        currency: 'USD',
        timeZone: 'UTC',
        addresses: [
          {
            type: 'STREET',
            addresses: ['100 Innovation Way'],
            city: 'San Francisco',
            country: 'US',
            postalCode: '94105'
          }
        ]
      },
      website: 'https://merra.io',
      createdDate: '2026-01-15',
      status: 'ACTIVE_ACCOUNT',
      financialYear: { yearEndDay: '31', yearEndMonth: '12' }
    }
  };

  beforeEach(async () => {
    organizationServiceSpy = jasmine.createSpyObj('OrganizationService', [
      'getCurrentOrganization',
      'getOrganizationMetadata',
      'getOrganizationMembers'
    ]);
    organizationServiceSpy.getCurrentOrganization.and.returnValue(of(mockOrgResponse));
    organizationServiceSpy.getOrganizationMetadata.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: {
        organizationTypes: [{ id: 'type-1', name: 'Company' }],
        organizationAddressTypes: [{ id: 'addr-1', name: 'Street Address' }],
        addresses: [],
        paymentTerms: { subElements: [], types: [] }
      }
    }));
    organizationServiceSpy.getOrganizationMembers.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: [
        {
          id: 'mem-1',
          userId: 'user-1',
          fullName: 'Alice Founder',
          email: 'alice@merra.com',
          role: 'CREATOR',
          status: 'ACTIVE',
          isCreator: true,
          isInvited: false,
          dateJoined: '2026-01-15'
        },
        {
          id: 'mem-2',
          userId: null,
          fullName: null,
          email: 'pending@merra.com',
          role: 'ADVISOR',
          status: 'PENDING',
          isCreator: false,
          isInvited: true,
          invitedBy: 'Alice Founder',
          invitationDate: '2026-11-20'
        }
      ]
    }));

    networkKeyServiceSpy = jasmine.createSpyObj('NetworkKeyService', ['getActiveKeys']);
    networkKeyServiceSpy.getActiveKeys.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: []
    }));

    invitationServiceSpy = jasmine.createSpyObj('InvitationService', ['getInvitations']);
    invitationServiceSpy.getInvitations.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: []
    }));

    utilityServiceSpy = jasmine.createSpyObj('UtilityService', ['getCountries']);
    utilityServiceSpy.getCountries.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: [{ countryName: 'United States', isoAlpha2Code: 'US', code: 'USD' }]
    }));

    await TestBed.configureTestingModule({
      imports: [OrganizationProfile],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: OrganizationService, useValue: organizationServiceSpy },
        { provide: NetworkKeyService, useValue: networkKeyServiceSpy },
        { provide: InvitationService, useValue: invitationServiceSpy },
        { provide: UtilityService, useValue: utilityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display minimal profile summary', () => {
    expect(component).toBeTruthy();
    expect(component.currentOrganization?.names.displayName).toBe('Merra Solutions');
    expect(component.addresses.length).toBe(1);
    expect(component.getInitials()).toBe('MS');
  });

  it('should copy organization id correctly', () => {
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    component.copyOrganizationId();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('org-test-uuid');
  });

  it('should calculate financial year end display properly', () => {
    expect(component.getFinancialYearEndDisplay()).toBe('Dec. 31');
  });

  it('should display organization members and pending invitees with their roles', () => {
    expect(component.organizationMembers.length).toBe(2);
    expect(component.activeMembersCount).toBe(1);
    expect(component.pendingMembersCount).toBe(1);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Organization Members');
    expect(compiled.textContent).toContain('Alice Founder');
    expect(compiled.textContent).toContain('Creator (Owner)');
    expect(compiled.textContent).toContain('pending@merra.com');
    expect(compiled.textContent).toContain('Advisor (Administrator)');
    expect(compiled.textContent).toContain('Pending Invitee');

    component.setMemberFilter('PENDING');
    expect(component.filteredMembers.length).toBe(1);
    expect(component.filteredMembers[0].email).toBe('pending@merra.com');
  });

  it('should open interactive logo editor on file selection and support position, zoom, and rotation adjustments', () => {
    const file = new File(['dummy-logo'], 'logo.png', { type: 'image/png' });
    const event = { target: { files: [file], value: 'logo.png' } } as unknown as Event;

    component.onFileSelected(event);
    expect(component.showLogoEditorDialog).toBeTrue();
    expect(component.editorLogoUrl).toBeTruthy();

    component.nudgeEditorPosition(12, -8);
    expect(component.editorPanX).toBe(12);
    expect(component.editorPanY).toBe(-8);

    component.adjustEditorZoom(0.2);
    expect(component.editorZoom).toBe(1.2);

    component.rotateEditorLogo(90);
    expect(component.editorRotation).toBe(90);

    component.closeLogoEditorDialog();
    expect(component.showLogoEditorDialog).toBeFalse();
  });
});
