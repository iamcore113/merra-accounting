import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { OrganizationSettings } from './organization-settings';
import { OrganizationService } from '../../../../shared/services/organization-service';
import { NetworkKeyService } from '../../../../shared/services/network-key-service';
import { InvitationService } from '../../../../shared/services/invitation-service';
import { UtilityService } from '../../../../shared/services/utility-service';

describe('OrganizationSettings', () => {
  let component: OrganizationSettings;
  let fixture: ComponentFixture<OrganizationSettings>;
  let organizationServiceSpy: jasmine.SpyObj<OrganizationService>;
  let networkKeyServiceSpy: jasmine.SpyObj<NetworkKeyService>;
  let invitationServiceSpy: jasmine.SpyObj<InvitationService>;
  let utilityServiceSpy: jasmine.SpyObj<UtilityService>;

  const mockOrgResponse = {
    message: 'Success',
    success: true,
    response: 200,
    data: {
      organizationId: 'org-test-uuid-settings',
      organizationType: { typeId: 'type-1', name: 'COMPANY' },
      names: { displayName: 'Merra Core', legalName: 'Merra Core Inc.', description: 'Financial technology.' },
      address: {
        email: 'billing@merra.com',
        country: 'US',
        currency: 'USD',
        timeZone: 'UTC',
        addresses: [
          {
            type: 'STREET',
            addresses: ['500 Market St'],
            city: 'San Francisco',
            country: 'US',
            postalCode: '94105'
          }
        ]
      },
      website: 'https://merra.com',
      createdDate: '2026-01-01',
      status: 'ACTIVE_ACCOUNT',
      financialYear: { yearEndDay: '31', yearEndMonth: '12' },
      externalLinks: [
        { linkType: 'FACEBOOK', url: 'https://facebook.com/merra' }
      ]
    }
  };

  beforeEach(async () => {
    organizationServiceSpy = jasmine.createSpyObj('OrganizationService', [
      'getCurrentOrganization',
      'getOrganizationMetadata',
      'updateCurrentOrganization'
    ]);
    organizationServiceSpy.getCurrentOrganization.and.returnValue(of(mockOrgResponse));
    organizationServiceSpy.getOrganizationMetadata.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: {
        organizationTypes: [{ id: 'type-1', name: 'Company' }],
        organizationAddressTypes: [{ id: 'addr-type-1', name: 'Street Address' }],
        addresses: [],
        paymentTerms: { subElements: [], types: [] }
      }
    }));

    networkKeyServiceSpy = jasmine.createSpyObj('NetworkKeyService', [
      'getActiveKeys',
      'generateNetworkKey',
      'deleteNetworkKey'
    ]);
    networkKeyServiceSpy.getActiveKeys.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: []
    }));

    invitationServiceSpy = jasmine.createSpyObj('InvitationService', [
      'getInvitations',
      'createInvitation',
      'revokeInvitation'
    ]);
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
      imports: [OrganizationSettings],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        DialogService,
        { provide: OrganizationService, useValue: organizationServiceSpy },
        { provide: NetworkKeyService, useValue: networkKeyServiceSpy },
        { provide: InvitationService, useValue: invitationServiceSpy },
        { provide: UtilityService, useValue: utilityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationSettings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load default category (details)', () => {
    expect(component).toBeTruthy();
    expect(component.activeCategory()).toBe('details');
    expect(component.organizationForm.get('names.displayName')?.value).toBe('Merra Core');
    expect(component.addresses.length).toBe(1);
  });

  it('should switch categories correctly', () => {
    component.selectCategory('finances');
    expect(component.activeCategory()).toBe('finances');

    component.selectCategory('connected-sites');
    expect(component.activeCategory()).toBe('connected-sites');

    component.selectCategory('network-keys');
    expect(component.activeCategory()).toBe('network-keys');
  });

  it('should handle address dialog lifecycle', () => {
    component.openAddAddressDialog();
    expect(component.showAddressDialog).toBeTrue();
    expect(component.editingAddressIndex).toBeNull();

    component.closeAddressDialog();
    expect(component.showAddressDialog).toBeFalse();
  });

  it('should persist external links for the 4 supported platforms', () => {
    expect(component.externalLinkPlatforms.map((p) => p.value)).toEqual([
      'FACEBOOK',
      'X',
      'INSTAGRAM',
      'LINKEDIN'
    ]);
    expect(component.externalLinks.length).toBe(1);

    organizationServiceSpy.updateCurrentOrganization.and.returnValue(of({
      ...mockOrgResponse,
      data: {
        ...mockOrgResponse.data,
        externalLinks: [
          { linkType: 'FACEBOOK', url: 'https://facebook.com/merra' },
          { linkType: 'LINKEDIN', url: 'https://linkedin.com/company/merra' }
        ]
      }
    }));

    component.newLinkPlatform = 'LINKEDIN';
    component.newLinkUrl = 'https://linkedin.com/company/merra';
    component.addExternalLink();

    expect(organizationServiceSpy.updateCurrentOrganization).toHaveBeenCalled();
    expect(component.externalLinks.length).toBe(2);
  });
});
