import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { MainOrganization } from './main-organization';
import { OrganizationService } from '../../../shared/services/organization-service';
import { NetworkKeyService } from '../../../shared/services/network-key-service';
import { UtilityService } from '../../../shared/services/utility-service';

describe('MainOrganization', () => {
  let component: MainOrganization;
  let fixture: ComponentFixture<MainOrganization>;
  let organizationServiceSpy: jasmine.SpyObj<OrganizationService>;
  let networkKeyServiceSpy: jasmine.SpyObj<NetworkKeyService>;
  let utilityServiceSpy: jasmine.SpyObj<UtilityService>;

  const mockOrgResponse = {
    message: 'Success',
    success: true,
    response: 200,
    data: {
      organizationId: 'org-test-123',
      organizationType: { typeId: 'type-1', name: 'COMPANY' },
      names: { displayName: 'Acme Corp', legalName: 'Acme Corp Ltd', description: 'Test desc' },
      address: {
        email: 'info@acme.com',
        country: 'US',
        currency: 'USD',
        timeZone: 'UTC',
        addresses: [
          {
            type: 'STREET',
            addresses: ['123 Main St'],
            city: 'New York',
            country: 'US',
            postalCode: '10001'
          }
        ]
      },
      website: 'https://acme.com',
      createdDate: '2026-01-01',
      status: 'ACTIVE_ACCOUNT',
      financialYear: { yearEndDay: '31', yearEndMonth: '12' }
    }
  };

  const mockMetadataResponse = {
    message: 'Success',
    success: true,
    response: 200,
    data: {
      organizationTypes: [{ id: 'type-1', name: 'Company' }],
      organizationAddressTypes: [{ id: 'addr-type-1', name: 'Street Address' }],
      addresses: [],
      paymentTerms: { subElements: [], types: [] }
    }
  };

  const mockKeysResponse = {
    message: 'Success',
    success: true,
    response: 200,
    data: []
  };

  beforeEach(async () => {
    organizationServiceSpy = jasmine.createSpyObj('OrganizationService', [
      'getCurrentOrganization',
      'getOrganizationMetadata',
      'updateCurrentOrganization'
    ]);
    organizationServiceSpy.getCurrentOrganization.and.returnValue(of(mockOrgResponse));
    organizationServiceSpy.getOrganizationMetadata.and.returnValue(of(mockMetadataResponse));

    networkKeyServiceSpy = jasmine.createSpyObj('NetworkKeyService', [
      'getActiveKeys',
      'generateNetworkKey',
      'deleteNetworkKey'
    ]);
    networkKeyServiceSpy.getActiveKeys.and.returnValue(of(mockKeysResponse));

    utilityServiceSpy = jasmine.createSpyObj('UtilityService', ['getCountries']);
    utilityServiceSpy.getCountries.and.returnValue(of({
      message: 'Success',
      success: true,
      response: 200,
      data: [{ countryName: 'United States', isoAlpha2Code: 'US', code: 'USD' }]
    }));

    await TestBed.configureTestingModule({
      imports: [MainOrganization],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        MessageService,
        DialogService,
        { provide: OrganizationService, useValue: organizationServiceSpy },
        { provide: NetworkKeyService, useValue: networkKeyServiceSpy },
        { provide: UtilityService, useValue: utilityServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MainOrganization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial organization details', () => {
    expect(component).toBeTruthy();
    expect(component.currentOrganization?.names.displayName).toBe('Acme Corp');
    expect(component.addresses.length).toBe(1);
    expect(component.addresses[0].city).toBe('New York');
  });

  it('should open and close address dialog', () => {
    component.openAddAddressDialog();
    expect(component.showAddressDialog).toBeTrue();
    expect(component.editingAddressIndex).toBeNull();

    component.closeAddressDialog();
    expect(component.showAddressDialog).toBeFalse();
  });

  it('should populate addressForm when opening edit address dialog', () => {
    component.openEditAddressDialog(0);
    expect(component.showAddressDialog).toBeTrue();
    expect(component.editingAddressIndex).toBe(0);
    expect(component.addressForm.get('city')?.value).toBe('New York');
  });
});
