import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MainAccounts } from './main-accounts';
import { AccountService } from '../../../shared/services/account-service';

describe('MainAccounts', () => {
  let component: MainAccounts;
  let fixture: ComponentFixture<MainAccounts>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;

  beforeEach(async () => {
    accountServiceSpy = jasmine.createSpyObj('AccountService', [
      'getAllAccounts',
      'getAccountMetadata',
      'checkCodeExists',
      'createAccount',
      'updateAccount',
      'updateAccountStatus',
    ]);

    accountServiceSpy.getAllAccounts.and.returnValue(
      of({
        success: true,
        message: 'OK',
        response: 'OK',
        data: [
          {
            organizationID: 'org-1',
            accountID: 'acc-1',
            code: '100',
            accountName: 'Accounts Receivable',
            accountType: 'Current Asset',
            category: 'ASSET',
            entryType: 'DEBIT',
            status: 'ACTIVE',
            description: 'Money owed to the business.',
            taxType: 'NONE',
          },
          {
            organizationID: 'org-1',
            accountID: 'acc-2',
            code: '400',
            accountName: 'Sales Revenue',
            accountType: 'Revenue',
            category: 'REVENUE',
            entryType: 'CREDIT',
            status: 'ACTIVE',
            description: 'Income from core operations.',
            taxType: 'OUTPUT',
          },
        ],
      } as any)
    );

    accountServiceSpy.getAccountMetadata.and.returnValue(
      of({
        success: true,
        message: 'OK',
        response: 'OK',
        data: {
          categories: [{ id: '1', name: 'ASSET', entryType: 'DEBIT' }],
          accountTypes: [{ id: '2', name: 'Current Asset', category: 'ASSET' }],
        },
      } as any)
    );

    await TestBed.configureTestingModule({
      imports: [MainAccounts],
      providers: [
        { provide: AccountService, useValue: accountServiceSpy },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainAccounts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load accounts', () => {
    expect(component).toBeTruthy();
    expect(component.accounts.length).toBe(2);
    expect(component.getCountByCategory('ASSET')).toBe(1);
    expect(component.getCountByCategory('REVENUE')).toBe(1);
  });

  it('should filter accounts by category and search query', () => {
    component.setCategory('REVENUE');
    expect(component.filteredAccounts.length).toBe(1);
    expect(component.filteredAccounts[0].code).toBe('400');

    component.setCategory('ALL');
    component.searchQuery = 'Receivable';
    expect(component.filteredAccounts.length).toBe(1);
    expect(component.filteredAccounts[0].code).toBe('100');
  });
});
