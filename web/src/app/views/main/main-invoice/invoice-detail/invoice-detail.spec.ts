import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { InvoiceDetail } from './invoice-detail';
import { InvoiceService } from '../../../../shared/services/invoice-service';
import { ContactService } from '../../../../shared/services/contact-service';
import { InvoiceDetailResponse } from '../../../../shared/models/invoice';

describe('InvoiceDetail', () => {
  let component: InvoiceDetail;
  let fixture: ComponentFixture<InvoiceDetail>;
  let invoiceServiceSpy: jasmine.SpyObj<InvoiceService>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let messageServiceSpy: jasmine.SpyObj<MessageService>;
  let router: Router;

  const mockInvoice: InvoiceDetailResponse = {
    id: 'inv-1234',
    invoiceNumber: 'INV-1001',
    type: 'CUSTOMER',
    typeName: 'Customer Invoice (Sales)',
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
    contactTypeInitials: 'CT',
    organizationName: 'Merra Corp',
    currency: 'USD',
    lineItems: [
      {
        id: 'li-1',
        description: 'Consulting Services',
        quantity: 2,
        unitAmount: 50.0,
        accountCode: '200',
        discountRate: 0,
        taxType: 'OUTPUT2',
        taxRate: 15,
        lineAmount: 100.0,
        taxAmount: 15.0,
        total: 115.0
      }
    ]
  };

  beforeEach(async () => {
    invoiceServiceSpy = jasmine.createSpyObj('InvoiceService', [
      'getInvoiceById',
      'getInvoiceTypes',
      'updateInvoice',
      'updateInvoiceStatus',
      'deleteInvoice'
    ]);
    contactServiceSpy = jasmine.createSpyObj('ContactService', ['getContacts']);
    messageServiceSpy = jasmine.createSpyObj('MessageService', ['add']);

    invoiceServiceSpy.getInvoiceById.and.returnValue(of(mockInvoice));
    invoiceServiceSpy.getInvoiceTypes.and.returnValue(
      of([
        { id: 'CUSTOMER', name: 'Customer Invoice (Sales)' },
        { id: 'SUPPLIER', name: 'Supplier Invoice (Bills)' }
      ])
    );
    contactServiceSpy.getContacts.and.returnValue(
      of([
        {
          id: 'c-1',
          name: 'Wayne Enterprises',
          isCustomer: true,
          isSupplier: false,
          accountNumber: 'CUST-1001',
          emailAddress: 'bruce@wayne.com'
        } as any
      ])
    );

    await TestBed.configureTestingModule({
      imports: [InvoiceDetail],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'inv-1234' : null)
              }
            }
          }
        },
        { provide: InvoiceService, useValue: invoiceServiceSpy },
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: MessageService, useValue: messageServiceSpy }
      ]
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
        accountCode: '200',
        discountRate: 10, // 200 - 10% = 180
        taxRate: 15, // 180 * 15% = 27
        lineAmount: 0,
        taxAmount: 0,
        total: 0
      }
    ];
    component.recalculateTotals();

    expect(component.editSubTotal).toBeCloseTo(180, 2);
    expect(component.editTotalTax).toBeCloseTo(27, 2);
    expect(component.editGrandTotal).toBeCloseTo(207, 2);
  });

  it('should save edited invoice and refresh details', () => {
    invoiceServiceSpy.updateInvoice.and.returnValue(of(mockInvoice));
    component.startEditing();
    component.saveInvoice();

    expect(invoiceServiceSpy.updateInvoice).toHaveBeenCalled();
    expect(component.isEditing).toBeFalse();
    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success' })
    );
  });

  it('should update status and trigger message', () => {
    invoiceServiceSpy.updateInvoiceStatus.and.returnValue(of({ ...mockInvoice, status: 'AUTHORISED' }));
    component.applyStatusChange('AUTHORISED');

    expect(invoiceServiceSpy.updateInvoiceStatus).toHaveBeenCalledWith('inv-1234', 'AUTHORISED');
    expect(messageServiceSpy.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success' })
    );
  });

  it('should execute delete and navigate to list', () => {
    spyOn(router, 'navigate');
    invoiceServiceSpy.deleteInvoice.and.returnValue(of(null));
    component.executeDelete();

    expect(invoiceServiceSpy.deleteInvoice).toHaveBeenCalledWith('inv-1234');
    expect(router.navigate).toHaveBeenCalledWith(['/main/invoice']);
  });

  it('should navigate to preview on goToPreview()', () => {
    spyOn(router, 'navigate');
    component.goToPreview();
    expect(router.navigate).toHaveBeenCalledWith(['/main/invoice/preview', 'inv-1234']);
  });
});
