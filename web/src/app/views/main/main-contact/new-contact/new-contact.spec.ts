import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { NewContact } from './new-contact';
import { ContactService } from '../../../../shared/services/contact-service';
import { NetworkKeyService } from '../../../../shared/services/network-key-service';

describe('NewContact', () => {
  let component: NewContact;
  let fixture: ComponentFixture<NewContact>;
  let mockContactService: jasmine.SpyObj<ContactService>;
  let mockNetworkKeyService: jasmine.SpyObj<NetworkKeyService>;
  let messageService: MessageService;

  beforeEach(async () => {
    mockContactService = jasmine.createSpyObj('ContactService', [
      'createContact',
      'checkAccountNumberExists',
    ]);
    mockNetworkKeyService = jasmine.createSpyObj('NetworkKeyService', [
      'resolveNetworkKey',
      'getActiveKeys',
      'generateNetworkKey',
      'deleteNetworkKey',
    ]);

    mockContactService.createContact.and.returnValue(
      of({
        success: true,
        message: 'new contact created successfully',
        response: 200,
        data: { contactId: 'c-123', contactName: 'Acme Inc' },
      })
    );
    mockContactService.checkAccountNumberExists.and.returnValue(
      of({
        success: true,
        message: 'Checked',
        response: 200,
        data: { accountNumber: 'CUST-1001', exists: false },
      })
    );
    mockNetworkKeyService.resolveNetworkKey.and.returnValue(
      of({
        success: true,
        message: 'Valid',
        response: 200,
        data: {
          isValid: true,
          organizationId: 'org-456',
          organizationName: 'Global Supplies Ltd',
          legalName: 'Global Supplies Legal Corp.',
        },
      })
    );

    await TestBed.configureTestingModule({
      imports: [NewContact],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: ContactService, useValue: mockContactService },
        { provide: NetworkKeyService, useValue: mockNetworkKeyService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewContact);
    component = fixture.componentInstance;
    messageService = TestBed.inject(MessageService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have CUST prefix by default when isCustomer is true', () => {
    expect(component.currentPrefix).toBe('CUST');
  });

  it('should have SUP prefix when only isSupplier is true', () => {
    component.contactForm.patchValue({ isCustomer: false, isSupplier: true });
    expect(component.currentPrefix).toBe('SUP');
  });

  it('should have BOTH prefix when both isCustomer and isSupplier are true', () => {
    component.contactForm.patchValue({ isCustomer: true, isSupplier: true });
    expect(component.currentPrefix).toBe('BOTH');
  });

  it('should verify and resolve counterparty network key', () => {
    component.contactForm.patchValue({
      isTenant: true,
      counterpartyKey: 'mrk_live_abcdef1234567890abcdef1234567890',
    });

    component.verifyNetworkKey();

    expect(mockNetworkKeyService.resolveNetworkKey).toHaveBeenCalledWith(
      'mrk_live_abcdef1234567890abcdef1234567890'
    );
    expect(component.resolvedCounterparty?.organizationName).toBe('Global Supplies Ltd');
    expect(component.contactForm.get('name')?.value).toBe('Global Supplies Legal Corp.');
  });
});
