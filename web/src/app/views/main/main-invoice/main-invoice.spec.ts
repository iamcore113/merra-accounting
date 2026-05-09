import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { MainInvoice } from './main-invoice';

describe('MainInvoice', () => {
  let component: MainInvoice;
  let fixture: ComponentFixture<MainInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps the secondary panel hidden by default', () => {
    const panel = fixture.nativeElement.querySelector('#invoice-secondary-panel');

    expect(component.isSecondaryPanelOpen).toBeFalse();
    expect(panel.classList).toContain('secondary-column-hidden');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens the secondary panel from the primary trigger', () => {
    const trigger = fixture.debugElement.query(By.css('.panel-trigger'));

    trigger.nativeElement.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('#invoice-secondary-panel');
    expect(component.isSecondaryPanelOpen).toBeTrue();
    expect(panel.classList).not.toContain('secondary-column-hidden');
    expect(panel.getAttribute('aria-hidden')).toBe('false');
  });

  it('keeps the new invoice form hidden by default', () => {
    const formPanel = fixture.nativeElement.querySelector('#new-invoice-form-panel');

    expect(component.isNewInvoiceFormOpen).toBeFalse();
    expect(formPanel.classList).not.toContain('new-invoice-form-open');
    expect(formPanel.getAttribute('aria-hidden')).toBe('true');
  });

  it('opens the new invoice form from the title add button', () => {
    const trigger = fixture.debugElement.query(By.css('.title-add-button'));

    trigger.nativeElement.click();
    fixture.detectChanges();

    const formPanel = fixture.nativeElement.querySelector('#new-invoice-form-panel');
    expect(component.isNewInvoiceFormOpen).toBeTrue();
    expect(formPanel.classList).toContain('new-invoice-form-open');
    expect(formPanel.getAttribute('aria-hidden')).toBe('false');
  });
});
