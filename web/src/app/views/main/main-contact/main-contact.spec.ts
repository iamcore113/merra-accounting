import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MainContact } from './main-contact';
import { ContactService } from '../../../shared/services/contact-service';

describe('MainContact', () => {
  let component: MainContact;
  let fixture: ComponentFixture<MainContact>;
  let mockContactService: jasmine.SpyObj<ContactService>;

  beforeEach(async () => {
    mockContactService = jasmine.createSpyObj('ContactService', ['getAllContacts']);
    mockContactService.getAllContacts.and.returnValue(
      of({
        success: true,
        message: 'Success',
        response: 200,
        data: [
          {
            contactId: 'c-1',
            contactName: 'Acme Corp',
            accountNumber: 'ACC-001',
            emailAddress: 'acme@example.com',
            isSupplier: true,
            isCustomer: false,
            status: 'ACTIVE',
          },
        ],
      })
    );

    await TestBed.configureTestingModule({
      imports: [MainContact],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ContactService, useValue: mockContactService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainContact);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load contacts from ContactService on init and stop loading', () => {
    expect(mockContactService.getAllContacts).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.contacts.length).toBe(1);
    expect(component.contacts[0].name).toBe('Acme Corp');
    expect(component.contacts[0].accountNumber).toBe('ACC-001');
    expect(component.contacts[0].emailAddress).toBe('acme@example.com');
  });

  it('should display skeleton rows when isLoading is true', () => {
    component.isLoading = true;
    expect(component.tableData.length).toBe(5);
    expect(component.tableData[0].id).toBe('skeleton-0');
  });

  it('should filter contacts by name, account number, or email', () => {
    component.searchQuery = 'acme';
    expect(component.filteredContacts.length).toBe(1);

    component.searchQuery = 'ACC-001';
    expect(component.filteredContacts.length).toBe(1);

    component.searchQuery = 'example.com';
    expect(component.filteredContacts.length).toBe(1);

    component.searchQuery = 'nonexistent';
    expect(component.filteredContacts.length).toBe(0);
  });
});
