import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { NewContact } from './new-contact';
import { ContactService } from '../../../../shared/services/contact-service';

describe('NewContact', () => {
  let component: NewContact;
  let fixture: ComponentFixture<NewContact>;
  let mockContactService: jasmine.SpyObj<ContactService>;
  let messageService: MessageService;

  beforeEach(async () => {
    mockContactService = jasmine.createSpyObj('ContactService', [
      'createContact',
      'checkAccountNumberExists',
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

    await TestBed.configureTestingModule({
      imports: [NewContact],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: ContactService, useValue: mockContactService },
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

  it('should switch prefix to SUP when only isSupplier is true', () => {
    component.contactForm.patchValue({
      isCustomer: false,
      isSupplier: true,
    });
    expect(component.currentPrefix).toBe('SUP');
  });

  it('should switch prefix to BOTH when both isCustomer and isSupplier are true', () => {
    component.contactForm.patchValue({
      isCustomer: true,
      isSupplier: true,
    });
    expect(component.currentPrefix).toBe('BOTH');
  });

  it('should check if account number exists when 4 digits are entered', () => {
    component.contactForm.patchValue({
      accountNumberSuffix: '1001',
    });
    component.validateAccountNumberDuplication();

    expect(mockContactService.checkAccountNumberExists).toHaveBeenCalledWith('CUST-1001');
    expect(component.contactForm.get('accountNumberSuffix')?.hasError('alreadyExists')).toBeFalse();
  });

  it('should flag alreadyExists error when account number exists for organization', () => {
    mockContactService.checkAccountNumberExists.and.returnValue(
      of({
        success: true,
        message: 'Checked',
        response: 200,
        data: { accountNumber: 'CUST-1001', exists: true },
      })
    );

    component.contactForm.patchValue({
      accountNumberSuffix: '1001',
    });
    component.validateAccountNumberDuplication();

    expect(component.contactForm.get('accountNumberSuffix')?.hasError('alreadyExists')).toBeTrue();
    expect(component.accountNumberExistsError).toContain('already exists');
  });

  it('should format accountNumber as prefix-four_digits upon submission', () => {
    component.contactForm.patchValue({
      name: 'Acme Corporation',
      isCustomer: true,
      isSupplier: true,
      accountNumberSuffix: '1001',
    });

    component.onSubmit();

    expect(mockContactService.createContact).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'Acme Corporation',
        accountNumber: 'BOTH-1001',
        isCustomer: true,
        isSupplier: true,
      })
    );
  });
});
