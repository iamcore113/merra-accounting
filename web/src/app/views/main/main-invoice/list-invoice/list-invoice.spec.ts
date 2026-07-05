import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListInvoice } from './list-invoice';

describe('ListInvoice', () => {
  let component: ListInvoice;
  let fixture: ComponentFixture<ListInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListInvoice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
