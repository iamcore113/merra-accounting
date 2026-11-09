import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { AccountService } from '../../../shared/services/account-service';
import {
  AccountCategoryOption,
  AccountItem,
  AccountTypeOption,
  CreateAccountPayload,
} from '../../../shared/models/accounts';

export type AccountCategoryFilter = 'ALL' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type AccountStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

@Component({
  selector: 'app-main-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SkeletonModule,
    DialogModule,
    CheckboxModule,
  ],
  templateUrl: './main-accounts.html',
  styleUrl: './main-accounts.scss',
})
export class MainAccounts implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly cdr = inject(ChangeDetectorRef);

  accounts: AccountItem[] = [];
  isLoading = true;
  selectedCategory: AccountCategoryFilter = 'ALL';
  selectedStatus: AccountStatusFilter = 'ACTIVE';
  searchQuery = '';

  // Dialog state
  showAccountDialog = false;
  isEditing = false;
  editingAccountId: string | null = null;
  editingOriginalCode: string | null = null;
  isSaving = false;
  codeExistsError: string | null = null;
  isCheckingCode = false;
  accountForm!: FormGroup;

  categories: AccountCategoryOption[] = [
    { id: 'asset', name: 'ASSET', entryType: 'DEBIT' },
    { id: 'liability', name: 'LIABILITY', entryType: 'CREDIT' },
    { id: 'equity', name: 'EQUITY', entryType: 'CREDIT' },
    { id: 'revenue', name: 'REVENUE', entryType: 'CREDIT' },
    { id: 'expense', name: 'EXPENSE', entryType: 'DEBIT' },
  ];

  accountTypes: AccountTypeOption[] = [
    { id: 'ca', name: 'Current Asset', category: 'ASSET' },
    { id: 'inv', name: 'Inventory', category: 'ASSET' },
    { id: 'fa', name: 'Fixed Asset', category: 'ASSET' },
    { id: 'cl', name: 'Current Liability', category: 'LIABILITY' },
    { id: 'liab', name: 'Liability', category: 'LIABILITY' },
    { id: 'eq', name: 'Equity', category: 'EQUITY' },
    { id: 'rev', name: 'Revenue', category: 'REVENUE' },
    { id: 'exp', name: 'Expense', category: 'EXPENSE' },
    { id: 'dc', name: 'Direct Costs', category: 'EXPENSE' },
  ];

  readonly taxTypeOptions = [
    { label: 'Tax Exempt (NONE)', value: 'NONE' },
    { label: 'Tax on Sales (OUTPUT)', value: 'OUTPUT' },
    { label: 'Tax on Purchases (INPUT)', value: 'INPUT' },
    { label: 'GST Free Income (EXEMPTOUTPUT)', value: 'EXEMPTOUTPUT' },
    { label: 'GST Free Expenses (EXEMPTEXPENSES)', value: 'EXEMPTEXPENSES' },
  ];

  readonly skeletonRows: AccountItem[] = Array.from({ length: 6 }, (_, i) => ({
    organizationID: '',
    accountID: `skeleton-${i}`,
    code: '',
    accountName: '',
    accountType: '',
    category: 'ASSET',
    entryType: 'DEBIT',
    status: 'ACTIVE',
    description: '',
    taxType: 'NONE',
  }));

  ngOnInit(): void {
    this.initForm();
    this.loadAccounts();
    this.loadMetadata();
  }

  private initForm(): void {
    this.accountForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(20)]],
      accountName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      category: ['ASSET', Validators.required],
      accountType: ['Current Asset', Validators.required],
      taxType: ['NONE'],
      description: ['', [Validators.required, Validators.minLength(3)]],
      enablePaymentToAccount: [false],
      addToWatchList: [false],
      status: ['ACTIVE'],
    });

    this.accountForm.get('category')?.valueChanges.subscribe((cat: string) => {
      const matchingTypes = this.getAccountTypesForCategory(cat);
      const currentType = this.accountForm.get('accountType')?.value;
      if (matchingTypes.length > 0 && !matchingTypes.some((t) => t.name === currentType)) {
        this.accountForm.patchValue({ accountType: matchingTypes[0].name }, { emitEvent: false });
      }
    });
  }

  loadAccounts(): void {
    this.isLoading = true;
    this.accountService.getAllAccounts().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success && Array.isArray(res.data)) {
          this.accounts = res.data.map((acc) => {
            const cat = acc.category || this.inferCategory(acc.code, acc.accountType);
            const entry = acc.entryType || (cat === 'ASSET' || cat === 'EXPENSE' ? 'DEBIT' : 'CREDIT');
            return {
              ...acc,
              category: cat,
              entryType: entry,
              status: acc.status || 'ACTIVE',
              taxType: acc.taxType || 'NONE',
            };
          });
        } else {
          this.accounts = [];
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load accounts:', err);
        this.accounts = [];
        this.cdr.markForCheck();
      },
    });
  }

  loadMetadata(): void {
    this.accountService.getAccountMetadata().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          if (res.data.categories?.length) {
            this.categories = res.data.categories;
          }
          if (res.data.accountTypes?.length) {
            this.accountTypes = res.data.accountTypes;
          }
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // Keep static fallback metadata
      },
    });
  }

  private inferCategory(code: string, accountType?: string): string {
    const t = (accountType || '').toUpperCase();
    if (t.includes('ASSET') || t.includes('INVENTORY')) return 'ASSET';
    if (t.includes('LIABILITY')) return 'LIABILITY';
    if (t.includes('EQUITY')) return 'EQUITY';
    if (t.includes('REVENUE') || t.includes('INCOME')) return 'REVENUE';
    if (t.includes('EXPENSE') || t.includes('COST')) return 'EXPENSE';

    const c = (code || '').trim();
    if (c.startsWith('1')) return 'ASSET';
    if (c.startsWith('2')) return 'LIABILITY';
    if (c.startsWith('3')) return 'EQUITY';
    if (c.startsWith('4')) return 'REVENUE';
    return 'EXPENSE';
  }

  getAccountTypesForCategory(category?: string): AccountTypeOption[] {
    if (!category) return this.accountTypes;
    const filtered = this.accountTypes.filter(
      (t) => t.category?.toUpperCase() === category.toUpperCase()
    );
    return filtered.length > 0 ? filtered : this.accountTypes;
  }

  get filteredAccountTypeOptions(): AccountTypeOption[] {
    const cat = this.accountForm?.get('category')?.value;
    return this.getAccountTypesForCategory(cat);
  }

  get allCount(): number {
    return this.accounts.length;
  }

  getCountByCategory(cat: AccountCategoryFilter): number {
    if (cat === 'ALL') return this.accounts.length;
    return this.accounts.filter((a) => a.category?.toUpperCase() === cat).length;
  }

  get filteredAccounts(): AccountItem[] {
    return this.accounts.filter((acc) => {
      const matchCategory =
        this.selectedCategory === 'ALL' ||
        acc.category?.toUpperCase() === this.selectedCategory;

      const matchStatus =
        this.selectedStatus === 'ALL' ||
        (acc.status || 'ACTIVE').toUpperCase() === this.selectedStatus;

      const q = this.searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        acc.code.toLowerCase().includes(q) ||
        acc.accountName.toLowerCase().includes(q) ||
        (acc.accountType || '').toLowerCase().includes(q) ||
        (acc.description || '').toLowerCase().includes(q);

      return matchCategory && matchStatus && matchSearch;
    });
  }

  get tableData(): AccountItem[] {
    return this.isLoading ? this.skeletonRows : this.filteredAccounts;
  }

  setCategory(cat: AccountCategoryFilter): void {
    this.selectedCategory = cat;
  }

  setStatusFilter(status: AccountStatusFilter): void {
    this.selectedStatus = status;
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.editingAccountId = null;
    this.editingOriginalCode = null;
    this.codeExistsError = null;
    const defaultCategory = this.selectedCategory !== 'ALL' ? this.selectedCategory : 'ASSET';
    const defaultTypes = this.getAccountTypesForCategory(defaultCategory);
    this.accountForm.reset({
      code: '',
      accountName: '',
      category: defaultCategory,
      accountType: defaultTypes[0]?.name || 'Current Asset',
      taxType: 'NONE',
      description: '',
      enablePaymentToAccount: false,
      addToWatchList: false,
      status: 'ACTIVE',
    });
    this.showAccountDialog = true;
  }

  openEditDialog(account: AccountItem): void {
    this.isEditing = true;
    this.editingAccountId = account.accountID;
    this.editingOriginalCode = account.code;
    this.codeExistsError = null;
    this.accountForm.reset({
      code: account.code,
      accountName: account.accountName,
      category: account.category || 'ASSET',
      accountType: account.accountType || 'Current Asset',
      taxType: account.taxType || 'NONE',
      description: account.description || '',
      enablePaymentToAccount: !!account.enablePaymentToAccount,
      addToWatchList: !!account.addToWatchList,
      status: account.status || 'ACTIVE',
    });
    this.showAccountDialog = true;
  }

  closeDialog(): void {
    this.showAccountDialog = false;
    this.isSaving = false;
    this.codeExistsError = null;
  }

  onCodeBlur(): void {
    const code = this.accountForm.get('code')?.value?.trim();
    if (!code) {
      this.codeExistsError = null;
      return;
    }
    if (
      this.isEditing &&
      this.editingOriginalCode &&
      this.editingOriginalCode.toLowerCase() === code.toLowerCase()
    ) {
      this.codeExistsError = null;
      return;
    }

    this.isCheckingCode = true;
    this.accountService.checkCodeExists(code).subscribe({
      next: (res) => {
        this.isCheckingCode = false;
        if (res.success && res.data?.exists) {
          this.codeExistsError = `Account code '${code}' is already in use in this organization.`;
        } else {
          this.codeExistsError = null;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isCheckingCode = false;
        this.cdr.markForCheck();
      },
    });
  }

  saveAccount(): void {
    if (this.accountForm.invalid || this.codeExistsError) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const v = this.accountForm.value;
    const payload: CreateAccountPayload = {
      code: v.code.trim(),
      accountName: v.accountName.trim(),
      category: v.category,
      accountType: v.accountType,
      taxType: v.taxType || 'NONE',
      description: v.description.trim(),
      enablePaymentToAccount: !!v.enablePaymentToAccount,
      addToWatchList: !!v.addToWatchList,
      status: v.status || 'ACTIVE',
    };

    this.isSaving = true;
    const request$ =
      this.isEditing && this.editingAccountId
        ? this.accountService.updateAccount(this.editingAccountId, payload)
        : this.accountService.createAccount(payload);

    request$.subscribe({
      next: (res) => {
        this.isSaving = false;
        if (res.success && res.data) {
          this.showAccountDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: this.isEditing ? 'Account Updated' : 'Account Created',
            detail: `${res.data.code} — ${res.data.accountName} has been saved.`,
            life: 3000,
          });
          this.loadAccounts();
        }
      },
      error: (err) => {
        this.isSaving = false;
        const msg = err.error?.message || err.message || 'Failed to save account.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
          life: 4000,
        });
        this.cdr.markForCheck();
      },
    });
  }

  toggleArchiveStatus(account: AccountItem): void {
    const newStatus = account.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
    this.accountService.updateAccountStatus(account.accountID, newStatus).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          account.status = res.data.status || newStatus;
          this.messageService.add({
            severity: 'success',
            summary: newStatus === 'ARCHIVED' ? 'Account Archived' : 'Account Restored',
            detail: `${account.code} — ${account.accountName} is now ${newStatus.toLowerCase()}.`,
            life: 3000,
          });
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        const msg = err.error?.message || err.message || 'Failed to update account status.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
          life: 4000,
        });
      },
    });
  }

  getCategorySeverity(category?: string): 'info' | 'warn' | 'secondary' | 'success' | 'danger' | 'contrast' {
    switch (category?.toUpperCase()) {
      case 'ASSET':
        return 'info';
      case 'LIABILITY':
        return 'warn';
      case 'EQUITY':
        return 'secondary';
      case 'REVENUE':
        return 'success';
      case 'EXPENSE':
        return 'danger';
      default:
        return 'secondary';
    }
  }
}
