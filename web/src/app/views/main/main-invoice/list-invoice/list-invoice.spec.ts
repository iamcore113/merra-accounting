import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ListInvoice } from './list-invoice';

describe('ListInvoice', () => {
  let component: ListInvoice;
  let fixture: ComponentFixture<ListInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListInvoice],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate accurate count badges for all, customer, and supplier invoices', () => {
    expect(component.allCount).toBe(6);
    expect(component.customerCount).toBe(3);
    expect(component.supplierCount).toBe(3);
  });

  it('should list all invoices by default', () => {
    expect(component.selectedType).toBe('ALL');
    expect(component.filteredInvoices.length).toBe(6);
  });

  it('should filter invoices by customer type only', () => {
    component.setType('CUSTOMER');
    expect(component.selectedType).toBe('CUSTOMER');
    const filtered = component.filteredInvoices;
    expect(filtered.length).toBe(3);
    expect(filtered.every(inv => inv.type === 'CUSTOMER')).toBeTrue();
    expect(filtered.some(inv => inv.invoiceNumber === 'INV-00101')).toBeTrue();
  });

  it('should filter invoices by supplier type only', () => {
    component.setType('SUPPLIER');
    expect(component.selectedType).toBe('SUPPLIER');
    const filtered = component.filteredInvoices;
    expect(filtered.length).toBe(3);
    expect(filtered.every(inv => inv.type === 'SUPPLIER')).toBeTrue();
    expect(filtered.some(inv => inv.invoiceNumber === 'SUP-2026-01')).toBeTrue();
    expect(filtered.some(inv => inv.invoiceNumber === 'BILL-8891')).toBeTrue();
  });

  it('should filter by both type and status concurrently', () => {
    component.setType('CUSTOMER');
    component.setStatus('DRAFT');
    const filtered = component.filteredInvoices;
    expect(filtered.length).toBe(1);
    expect(filtered[0].invoiceNumber).toBe('INV-00102');
    expect(filtered[0].type).toBe('CUSTOMER');
    expect(filtered[0].status).toBe('DRAFT');
  });

  it('should filter by type, status, and search query', () => {
    component.setType('SUPPLIER');
    component.searchQuery = 'Cyberdyne';
    const filtered = component.filteredInvoices;
    expect(filtered.length).toBe(1);
    expect(filtered[0].contactName).toBe('Cyberdyne Systems');
    expect(filtered[0].type).toBe('SUPPLIER');
  });
});
