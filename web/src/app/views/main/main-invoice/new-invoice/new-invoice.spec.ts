import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

import { NewInvoice } from './new-invoice';
import { ContactService } from '../../../../shared/services/contact-service';
import { InvoiceService } from '../../../../shared/services/invoice-service';

describe('NewInvoice', () => {
  let component: NewInvoice;
  let fixture: ComponentFixture<NewInvoice>;
  let mockContactService: jasmine.SpyObj<ContactService>;
  let mockInvoiceService: jasmine.SpyObj<InvoiceService>;

  beforeEach(async () => {
    mockContactService = jasmine.createSpyObj('ContactService', [
      'getAllContacts',
      'createContact',
      'checkAccountNumberExists'
    ]);
    mockInvoiceService = jasmine.createSpyObj('InvoiceService', [
      'getInvoiceMetadata'
    ]);

    mockContactService.getAllContacts.and.returnValue(
      of({
        success: true,
        message: 'Success',
        response: 200,
        data: [
          { contactId: 'c-cust', contactName: 'Customer Only', isCustomer: true, isSupplier: false },
          { contactId: 'c-supp', contactName: 'Supplier Only', isCustomer: false, isSupplier: true },
          { contactId: 'c-both', contactName: 'Both Client', isCustomer: true, isSupplier: true }
        ]
      })
    );

    mockContactService.createContact.and.returnValue(
      of({
        success: true,
        message: 'Contact created successfully',
        response: 200,
        data: { contactId: 'c-999', contactName: 'New Test Client' }
      })
    );

    mockContactService.checkAccountNumberExists.and.returnValue(
      of({
        success: true,
        message: 'Checked',
        response: 200,
        data: { accountNumber: 'CUST-1001', exists: false }
      })
    );

    mockInvoiceService.getInvoiceMetadata.and.returnValue(
      of({
        success: true,
        message: 'Success',
        response: 200,
        data: {
          invoiceTypes: [{ id: 'CUSTOMER_INVOICE', name: 'Customer Invoice' }],
          invoiceStatusCodes: [{ code: 'DRAFT' }],
          lineAmountTypes: [{ name: 'EXCLUSIVE' }]
        }
      })
    );

    await TestBed.configureTestingModule({
      imports: [NewInvoice],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: ContactService, useValue: mockContactService },
        { provide: InvoiceService, useValue: mockInvoiceService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NewInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open new contact dialog instead of navigating away', () => {
    const dummyEvent = new MouseEvent('click');
    spyOn(dummyEvent, 'stopPropagation');

    expect(component.showNewContactDialog).toBeFalse();
    component.openNewContactDialog(dummyEvent);

    expect(dummyEvent.stopPropagation).toHaveBeenCalled();
    expect(component.showNewContactDialog).toBeTrue();
    expect(component.newContactForm).toBeDefined();
    expect(component.newContactForm.get('name')?.value).toBe('');
    expect(component.newContactForm.get('isCustomer')?.value).toBeTrue();
    expect(component.newContactForm.get('isSupplier')?.value).toBeFalse();
  });

  it('should require at least one relationship type', () => {
    component.openNewContactDialog();
    component.newContactForm.patchValue({
      name: 'New Test Client',
      isCustomer: false,
      isSupplier: false
    });

    component.saveNewContact();

    expect(mockContactService.createContact).not.toHaveBeenCalled();
    expect(component.showNewContactDialog).toBeTrue();
  });

  it('should validate and create new contact and select it in the invoice form', () => {
    component.openNewContactDialog();
    component.newContactForm.patchValue({
      name: 'New Test Client',
      isCustomer: true,
      isSupplier: false
    });

    component.saveNewContact();

    expect(mockContactService.createContact).toHaveBeenCalledWith(
      jasmine.objectContaining({
        name: 'New Test Client',
        isCustomer: true,
        isSupplier: false,
        contactStatus: 'ACTIVE'
      })
    );

    expect(component.showNewContactDialog).toBeFalse();
    expect(component.invoiceForm.get('contact')?.value).toBe('c-999');
    expect(component.contacts.some(c => c.id === 'c-999')).toBeTrue();
  });

  it('should close dialog when canceled', () => {
    component.openNewContactDialog();
    expect(component.showNewContactDialog).toBeTrue();

    component.onCloseNewContactDialog();
    expect(component.showNewContactDialog).toBeFalse();
  });

  it('should map contact types, typeLabels, and typeInitials correctly', () => {
    expect(component.contacts.length).toBe(3);
    const cust = component.contacts.find(c => c.id === 'c-cust');
    const supp = component.contacts.find(c => c.id === 'c-supp');
    const both = component.contacts.find(c => c.id === 'c-both');

    expect(cust?.typeLabel).toBe('Customer');
    expect(cust?.typeInitials).toBe('CT');
    expect(cust?.displayName).toBe('Customer Only (CT)');

    expect(supp?.typeLabel).toBe('Supplier');
    expect(supp?.typeInitials).toBe('SP');
    expect(supp?.displayName).toBe('Supplier Only (SP)');

    expect(both?.typeLabel).toBe('Both');
    expect(both?.typeInitials).toBe('BT');
    expect(both?.displayName).toBe('Both Client (BT)');
  });

  it('should prevent creating a customer invoice when the selected contact is only a supplier', () => {
    component.types = [
      { code: 'CUSTOMER_INVOICE', name: 'Customer Invoice (Sales)' },
      { code: 'SUPPLIER_INVOICE', name: 'Supplier Invoice (Bills)' }
    ];

    // Select Customer Invoice type and Supplier only contact
    component.invoiceForm.patchValue({
      type: 'CUSTOMER_INVOICE',
      contact: 'c-supp'
    });

    expect(component.contactTypeMismatchError).toBeTruthy();
    expect(component.contactTypeMismatchError).toContain("only a Supplier, not a Customer");
    expect(component.invoiceForm.get('type')?.hasError('contactTypeMismatch')).toBeTrue();
  });

  it('should allow creating a customer invoice when contact is customer or both', () => {
    component.types = [
      { code: 'CUSTOMER_INVOICE', name: 'Customer Invoice (Sales)' },
      { code: 'SUPPLIER_INVOICE', name: 'Supplier Invoice (Bills)' }
    ];

    // Select Customer Invoice with Customer Only contact
    component.invoiceForm.patchValue({
      type: 'CUSTOMER_INVOICE',
      contact: 'c-cust'
    });
    expect(component.contactTypeMismatchError).toBeNull();

    // Select Customer Invoice with Both contact
    component.invoiceForm.patchValue({
      type: 'CUSTOMER_INVOICE',
      contact: 'c-both'
    });
    expect(component.contactTypeMismatchError).toBeNull();
  });

  it('should prevent creating a supplier invoice when the selected contact is only a customer', () => {
    component.types = [
      { code: 'CUSTOMER_INVOICE', name: 'Customer Invoice (Sales)' },
      { code: 'SUPPLIER_INVOICE', name: 'Supplier Invoice (Bills)' }
    ];

    component.invoiceForm.patchValue({
      type: 'SUPPLIER_INVOICE',
      contact: 'c-cust'
    });

    expect(component.contactTypeMismatchError).toBeTruthy();
    expect(component.contactTypeMismatchError).toContain("only a Customer, not a Supplier");
  });
});
