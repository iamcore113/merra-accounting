import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';

import { ContactDetail } from './contact-detail';
import { ContactService } from '../../../../shared/services/contact-service';
import { ContactDetailResponse, UpdateContactRequest } from '../../../../shared/models/contacts';
import { SuccessResponse, Config } from '../../../../shared/models/api_response';

describe('ContactDetail', () => {
  let component: ContactDetail;
  let fixture: ComponentFixture<ContactDetail>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let router: Router;
  let messageService: MessageService;

  const mockContact: ContactDetailResponse = {
    contactId: '6370d6a8-7c25-4e9a-9101-ff78808a95fd',
    name: 'Acme Corporation',
    firstName: 'Jane',
    lastName: 'Doe',
    emailAddress: 'jane@acme.com',
    accountNumber: 'CUST-1001',
    isSupplier: false,
    isCustomer: true,
    taxNumber: 'TAX-9988',
    companyNumber: 'CRN-1122',
    contactStatus: 'ACTIVE',
    createdAt: '2026-11-04T10:00:00',
    updatedAt: '2026-11-04T12:00:00',
  };

  const mockResponse: SuccessResponse<ContactDetailResponse> = {
    message: 'Success',
    success: true,
    response: 200,
    data: mockContact,
  };

  beforeEach(async () => {
    contactServiceSpy = jasmine.createSpyObj('ContactService', [
      'getContactById',
      'updateContact',
      'deleteContact',
      'checkAccountNumberExists',
    ]);
    contactServiceSpy.getContactById.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [ContactDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: ContactService, useValue: contactServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '6370d6a8-7c25-4e9a-9101-ff78808a95fd' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactDetail);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    messageService = TestBed.inject(MessageService);
    spyOn(router, 'navigate');
    spyOn(messageService, 'add');
    fixture.detectChanges();
  });

  it('should create component and load contact details', () => {
    expect(component).toBeTruthy();
    expect(component.isLoading).toBeFalse();
    expect(component.contact).toEqual(mockContact);
    expect(contactServiceSpy.getContactById).toHaveBeenCalledWith('6370d6a8-7c25-4e9a-9101-ff78808a95fd');
    expect(component.editForm.get('name')?.value).toBe('Acme Corporation');
    expect(component.editForm.get('accountNumberSuffix')?.value).toBe('1001');
  });

  it('should compute customer relationship label correctly', () => {
    expect(component.relationshipLabel).toBe('Customer');
    expect(component.relationshipType).toBe('CUSTOMER');
  });

  it('should compute supplier and both relationships correctly', () => {
    component.contact = {
      ...mockContact,
      isCustomer: true,
      isSupplier: true,
    };
    expect(component.relationshipLabel).toBe('Customer & Supplier');
    expect(component.relationshipType).toBe('BOTH');

    component.contact = {
      ...mockContact,
      isCustomer: false,
      isSupplier: true,
    };
    expect(component.relationshipLabel).toBe('Supplier');
    expect(component.relationshipType).toBe('SUPPLIER');
  });

  it('should compute person full name and initials correctly', () => {
    expect(component.personFullName).toBe('Jane Doe');
    expect(component.contactInitials).toBe('AC');
  });

  it('should handle load error gracefully', () => {
    contactServiceSpy.getContactById.and.returnValue(
      throwError(() => ({ error: { message: 'Contact not found' } }))
    );

    component.loadContactDetails('non-existent-id');
    expect(component.isLoading).toBeFalse();
    expect(component.loadError).toBe('Contact not found');
  });

  it('should toggle edit mode with startEditing and cancelEditing', () => {
    expect(component.isEditing).toBeFalse();
    component.startEditing();
    expect(component.isEditing).toBeTrue();

    // Modify a form value
    component.editForm.patchValue({ name: 'Changed Name' });
    expect(component.editForm.get('name')?.value).toBe('Changed Name');

    // Cancel should revert to original contact values
    component.cancelEditing();
    expect(component.isEditing).toBeFalse();
    expect(component.editForm.get('name')?.value).toBe('Acme Corporation');
  });

  it('should calculate currentPrefix dynamically based on checkboxes', () => {
    component.editForm.patchValue({ isCustomer: true, isSupplier: false });
    expect(component.currentPrefix).toBe('CUST');

    component.editForm.patchValue({ isCustomer: false, isSupplier: true });
    expect(component.currentPrefix).toBe('SUP');

    component.editForm.patchValue({ isCustomer: true, isSupplier: true });
    expect(component.currentPrefix).toBe('BOTH');
  });

  it('should update contact details when saveChanges is called', () => {
    const updatedContact: ContactDetailResponse = {
      ...mockContact,
      name: 'Acme Global Inc.',
      accountNumber: 'CUST-2002',
    };

    const updateResponse: SuccessResponse<ContactDetailResponse> = {
      message: 'Contact updated successfully',
      success: true,
      response: 200,
      data: updatedContact,
    };

    contactServiceSpy.updateContact.and.returnValue(of(updateResponse));

    component.startEditing();
    component.editForm.patchValue({
      name: 'Acme Global Inc.',
      accountNumberSuffix: '2002',
      isCustomer: true,
      isSupplier: false,
    });

    component.saveChanges();

    expect(contactServiceSpy.updateContact).toHaveBeenCalledWith(
      '6370d6a8-7c25-4e9a-9101-ff78808a95fd',
      jasmine.objectContaining({
        name: 'Acme Global Inc.',
        accountNumber: 'CUST-2002',
        isCustomer: true,
        isSupplier: false,
      } as UpdateContactRequest)
    );

    expect(component.isSaving).toBeFalse();
    expect(component.isEditing).toBeFalse();
    expect(component.contact?.name).toBe('Acme Global Inc.');
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'success',
        summary: 'Updated',
      })
    );
  });

  it('should handle update error gracefully in saveChanges', () => {
    contactServiceSpy.updateContact.and.returnValue(
      throwError(() => ({ error: { message: 'Duplicate account number' } }))
    );

    component.startEditing();
    component.saveChanges();

    expect(component.isSaving).toBeFalse();
    expect(component.isEditing).toBeTrue();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'error',
        summary: 'Update Failed',
        detail: 'Duplicate account number',
      })
    );
  });

  it('should open and close delete dialog', () => {
    expect(component.showDeleteDialog).toBeFalse();
    component.openDeleteDialog();
    expect(component.showDeleteDialog).toBeTrue();
    component.closeDeleteDialog();
    expect(component.showDeleteDialog).toBeFalse();
  });

  it('should confirm delete, show toast, and navigate to contacts list', () => {
    const deleteResponse: Config = {
      message: 'Contact deleted successfully',
      success: true,
      response: 200,
    };

    contactServiceSpy.deleteContact.and.returnValue(of(deleteResponse));

    component.openDeleteDialog();
    component.confirmDelete();

    expect(contactServiceSpy.deleteContact).toHaveBeenCalledWith('6370d6a8-7c25-4e9a-9101-ff78808a95fd');
    expect(component.isDeleting).toBeFalse();
    expect(component.showDeleteDialog).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'success',
        summary: 'Deleted',
      })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/main/contacts']);
  });

  it('should handle error when contact deletion fails', () => {
    contactServiceSpy.deleteContact.and.returnValue(
      throwError(() => ({ error: { message: 'Cannot delete contact in use' } }))
    );

    component.openDeleteDialog();
    component.confirmDelete();

    expect(component.isDeleting).toBeFalse();
    expect(component.showDeleteDialog).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'error',
        summary: 'Delete Failed',
        detail: 'Cannot delete contact in use',
      })
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
