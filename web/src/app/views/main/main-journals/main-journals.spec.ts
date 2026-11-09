import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';
import { MainJournals } from './main-journals';
import { JournalService } from '../../../shared/services/journal-service';

describe('MainJournals', () => {
  let component: MainJournals;
  let fixture: ComponentFixture<MainJournals>;

  const mockJournalService = {
    getAllJournals: () =>
      of({
        success: true,
        message: 'Retrieved journals.',
        status: 'OK',
        time: new Date().toISOString(),
        data: [
          {
            journalId: 'jrn-1',
            journalNumber: 1,
            journalDate: '2026-11-10',
            narration: 'Customer Invoice INV-0001 - Acme Corp',
            invoiceId: 'inv-1',
            invoiceNumber: 'INV-0001',
            invoiceType: 'CUSTOMER_INVOICE',
            contactName: 'Acme Corp',
            totalDebit: 5000,
            totalCredit: 5000,
            journalLines: [
              {
                journalLineId: 'jl-1',
                accountId: 'acc-100',
                accountCode: '100',
                accountName: 'Accounts Receivable',
                accountType: 'ACCOUNTS_RECEIVABLE',
                description: 'Accounts Receivable - INV-0001',
                taxType: 'NONE',
                debit: 5000,
                credit: 0,
              },
              {
                journalLineId: 'jl-2',
                accountId: 'acc-400',
                accountCode: '400',
                accountName: 'Sales Revenue',
                accountType: 'REVENUE',
                description: 'Sales Revenue (400)',
                taxType: 'OUTPUT',
                debit: 0,
                credit: 5000,
              },
            ],
          },
        ],
      }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainJournals],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        MessageService,
        { provide: JournalService, useValue: mockJournalService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainJournals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load balanced journals', () => {
    expect(component).toBeTruthy();
    expect(component.journals.length).toBe(1);
    expect(component.totalDebitsAmount).toBe(5000);
    expect(component.totalCreditsAmount).toBe(5000);
    expect(component.isLedgerBalanced).toBe(true);
  });
});
