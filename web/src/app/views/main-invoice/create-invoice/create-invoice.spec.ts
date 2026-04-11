import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CreateInvoice } from './create-invoice';
import { ContactService } from '../../../shared/services/contact-service';

describe('CreateInvoice', () => {
  let component: CreateInvoice;
  let fixture: ComponentFixture<CreateInvoice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateInvoice],
      providers: [
        {
          provide: ContactService,
          useValue: {
            getAllContacts: () => of({
              message: 'ok',
              result: true,
              response: 200,
              data: [],
            }),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateInvoice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
