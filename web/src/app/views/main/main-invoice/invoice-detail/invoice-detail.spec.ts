import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { InvoiceDetail } from './invoice-detail';
import { InvoiceService } from '../../../../shared/services/invoice-service';
import { ContactService } from '../../../../shared/services/contact-service';
import { AccountService } from '../../../../shared/services/account-service';
import { JournalService } from '../../../../shared/services/journal-service';
import { InvoiceDetailResponse } from '../../../../shared/models/invoice';

describe('InvoiceDetail', () => {
  let component: InvoiceDetail;
  let fixture: ComponentFixture<InvoiceDetail>;
  let invoiceServiceSpy: jasmine.SpyObj<InvoiceService>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;
  let journalServiceSpy: jasmine.SpyObj<JournalService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let router: Router;

  const mockInvoice: InvoiceDetailResponse = {
    invoiceId: 'inv-1234',
    invoiceNumber: 'INV-1001',
    type: 'CUSTOMER',
    status: 'DRAFT',
    date: '2026-11-10',
    dueDate: '2026-11-20',
    reference: 'REF-001',
    lineAmountTypes: 'EXCLUSIVE',
    subTotal: 100.0,
    totalTax: 15.0,
    grandTotal: 115.0,
    contactId: 'c-1',
    contactName: 'Wayne Enterprises',
    contactAccountNumber: 'CUST-1001',
    contactEmail: 'bruce@wayne.com',
    contactTypeInitials: 'CT',
    organizationId: 'org-1',
    organizationName: 'Merra Corp',
    taxEligible: true,
    lineItems: [
      {
        lineItemId: 'li-1',
        description: 'Consulting Services',
        quantity: 2,
        unitAmount: 50.0,
        accountCode: '400',
        discountRate: 0,
        taxType: 'OUTPUT2',
        lineAmount: 100.0,
        taxAmount: 15.0,
        total: 115.0,
      },
    ],
  };

  beforeEach(async () => {
    invoiceServiceSpy = jasmine.createSpyObj('InvoiceService', [
      'getInvoiceById',
      'getInvoiceMetadata',
      'updateInvoice',
      'updateInvoiceStatus',
      'deleteInvoice',
    ]);
    contactServiceSpy = jasmine.createSpyObj('ContactService', ['getAllContacts']);
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['getAllAccounts']);
    journalServiceSpy = jasmine.createSpyObj('JournalService', ['getJournalsByInvoiceId']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    invoiceServiceSpy.getInvoiceById.and.returnValue(
      of({
        success: true,
        message: 'Retrieved',
        status: 'OK',
        time: new Date().toISOString(),
        data: mockInvoice,
      } as any)
    );
    invoiceServiceSpy.getInvoiceMetadata.and.returnValue(
      of({
        success: true,
        message: 'Metadata',
        status: 'OK',
        time: new Date().toISOString(),
        data: {
          invoiceTypes: [
            { id: 'CUSTOMER', name: 'Customer Invoice (Sales)' },
            { id: 'SUPPLIER', name: 'Supplier Invoice (Bills)' },
          ],
          invoiceStatusCodes: [],
          lineAmountTypes: [],
        },
      } as any)
    );
    contactServiceSpy.getAllContacts.and.returnValue(
      of({
        success: true,
        message: 'Contacts',
        response: 200,
        data: [
          {
            contactId: 'c-1',
            contactName: 'Wayne Enterprises',
            isCustomer: true,
            isSupplier: false,
            accountNumber: 'CUST-1001',
            emailAddress: 'bruce@wayne.com',
          },
        ],
      } as any)
    );
    accountServiceSpy.getAllAccounts.and.returnValue(
      of({
        success: true,
        message: 'Accounts',
        response: 200,
        data: [],
      } as any)
    );
    journalServiceSpy.getJournalsByInvoiceId.and.returnValue(
      of({
        success: true,
        message: 'Journals',
        response: 200,
        data: [],
      } as any)
    );

    await TestBed.configureTestingModule({
      imports: [InvoiceDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'inv-1234' : null),
              },
            },
          },
        },
        { provide: InvoiceService, useValue: invoiceServiceSpy },
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: JournalService, useValue: journalServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(InvoiceDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load invoice details on init', () => {
    expect(invoiceServiceSpy.getInvoiceById).toHaveBeenCalledWith('inv-1234');
    expect(component.invoice).toEqual(mockInvoice);
    expect(component.isLoading).toBeFalse();
  });

  it('should return correct severity for invoice statuses', () => {
    expect(component.getStatusSeverity('PAID')).toBe('success');
    expect(component.getStatusSeverity('AUTHORISED')).toBe('info');
    expect(component.getStatusSeverity('APPROVED')).toBe('info');
    expect(component.getStatusSeverity('SUBMITTED')).toBe('warn');
    expect(component.getStatusSeverity('VOIDED')).toBe('danger');
    expect(component.getStatusSeverity('DRAFT')).toBe('secondary');
  });

  it('should populate edit form when startEditing is called', () => {
    component.startEditing();
    expect(component.isEditing).toBeTrue();
    expect(component.editForm.get('contact')?.value).toBe('c-1');
    expect(component.editForm.get('status')?.value).toBe('DRAFT');
    expect(component.editableLineItems.length).toBe(1);
    expect(component.editableLineItems[0].description).toBe('Consulting Services');
  });

  it('should add a line item in edit mode', () => {
    component.startEditing();
    const countBefore = component.editableLineItems.length;
    component.addLineItem();
    expect(component.editableLineItems.length).toBe(countBefore + 1);
  });

  it('should delete a line item in edit mode', () => {
    component.startEditing();
    component.addLineItem();
    expect(component.editableLineItems.length).toBe(2);
    component.deleteLineItem(0);
    expect(component.editableLineItems.length).toBe(1);
  });

  it('should recalculate totals correctly when line item changes', () => {
    component.startEditing();
    component.editableLineItems = [
      {
        description: 'Widget A',
        quantity: 2,
        unitAmount: 100,
        accountCode: '400',
        discountRate: 10, // 200 - 10% = 180
        taxRate: 15, // 180 * 15% = 27
        lineAmount: 0,
        taxAmount: 0,
        total: 0,
      },
    ];
    component.recalculateTotals();

    expect(component.editSubTotal).toBeCloseTo(180, 2);
    expect(component.editTotalTax).toBeCloseTo(27, 2);
    expect(component.editGrandTotal).toBeCloseTo(207, 2);
  });

  it('should save edited invoice and refresh details', () => {
    invoiceServiceSpy.updateInvoice.and.returnValue(
      of({
        success: true,
        message: 'Updated',
        status: 'OK',
        time: new Date().toISOString(),
        data: mockInvoice,
      } as any)
    );
    component.startEditing();
    component.editForm.patchValue({ invoiceType: 'CUSTOMER' });
    component.saveInvoice();

    expect(invoiceServiceSpy.updateInvoice).toHaveBeenCalled();
    expect(component.isEditing).toBeFalse();
    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success' })
    );
  });

  it('should update status and trigger message', () => {
    invoiceServiceSpy.updateInvoiceStatus.and.returnValue(
      of({
        success: true,
        message: 'Status updated',
        status: 'OK',
        time: new Date().toISOString(),
        data: { ...mockInvoice, status: 'AUTHORISED' },
      } as any)
    );
    component.applyStatusChange('AUTHORISED');

    expect(invoiceServiceSpy.updateInvoiceStatus).toHaveBeenCalledWith('inv-1234', 'AUTHORISED');
    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success' })
    );
  });

  it('should navigate to preview on goToPreview()', () => {
    spyOn(router, 'navigate');
    component.goToPreview();
    expect(router.navigate).toHaveBeenCalledWith(['/main/invoice/preview', 'inv-1234']);
  });
});
