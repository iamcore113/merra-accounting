import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Location } from '@angular/common';
import { InvoicePreview } from './invoice-preview';

describe('InvoicePreview', () => {
  let component: InvoicePreview;
  let fixture: ComponentFixture<InvoicePreview>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicePreview],
      providers: [
        provideRouter([])
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(InvoicePreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default sample invoice if no input or state provided', () => {
    expect(component.invoice).toBeDefined();
    expect(component.invoice?.invoiceNumber).toBe('INV-2026-0001');
    expect(component.invoice?.organizationName).toBe('Oscorp Industries');
    expect(component.invoice?.contactName).toBe('Acme Corporation');
    expect(component.invoice?.lineItems.length).toBe(3);
  });

  it('should return correct severity for invoice statuses', () => {
    expect(component.getStatusSeverity('PAID')).toBe('success');
    expect(component.getStatusSeverity('APPROVED')).toBe('info');
    expect(component.getStatusSeverity('AUTHORISED')).toBe('info');
    expect(component.getStatusSeverity('SUBMITTED')).toBe('warn');
    expect(component.getStatusSeverity('VOIDED')).toBe('danger');
    expect(component.getStatusSeverity('DRAFT')).toBe('secondary');
  });

  it('should call window.print when printInvoice or downloadPdf is executed', () => {
    spyOn(window, 'print');
    component.printInvoice();
    expect(window.print).toHaveBeenCalledTimes(1);

    component.downloadPdf();
    expect(window.print).toHaveBeenCalledTimes(2);
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate(new Date('2026-10-15T00:00:00'));
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('15');
  });

  it('should navigate back on goBack()', () => {
    spyOn(location, 'back');
    component.goBack();
    expect(location.back).toHaveBeenCalled();
  });

  it('should navigate to edit on editInvoice()', () => {
    spyOn(router, 'navigate');
    component.editInvoice();
    expect(router.navigate).toHaveBeenCalledWith(['/main/invoice', component.invoice?.id]);
  });
});

