import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { InvoiceService } from '../../../../shared/services/invoice-service';
import { InvoiceDetailResponse } from '../../../../shared/models/invoice';

export interface InvoicePreviewLineItem {
  item?: string;
  description?: string;
  account?: string;
  quantity: number;
  price: number;
  discount?: number;
  taxRate?: number;
  amount: number;
}

export interface InvoicePreviewData {
  id?: string;
  invoiceNumber: string;
  organizationName: string;
  organizationEmail?: string;
  organizationPhone?: string;
  organizationAddress?: string;
  organizationTaxNumber?: string;
  type: string; // 'CUSTOMER_INVOICE' | 'SUPPLIER_INVOICE'
  typeName?: string;
  contactName: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactAccountNumber?: string;
  contactTypeInitials?: string;
  date: string | Date;
  dueDate: string | Date;
  lineAmountTypes?: 'EXCLUSIVE' | 'INCLUSIVE' | 'NO_TAX';
  status: string; // 'DRAFT' | 'APPROVED' | 'PAID' | 'SUBMITTED' | 'AUTHORISED'
  reference?: string;
  currencySymbol?: string;
  lineItems: InvoicePreviewLineItem[];
  subTotal: number;
  totalDiscount?: number;
  totalTax: number;
  grandTotal: number;
  notes?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftBic?: string;
  };
}

@Component({
  selector: 'app-invoice-preview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    TableModule
  ],
  templateUrl: './invoice-preview.html',
  styleUrl: './invoice-preview.scss',
})
export class InvoicePreview implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly invoiceService = inject(InvoiceService);

  @Input() invoice?: InvoicePreviewData;
  @Input() isModal = false;

  readonly defaultSampleInvoice: InvoicePreviewData = {
    id: 'inv-preview-default',
    invoiceNumber: 'INV-2026-0001',
    organizationName: 'Oscorp Industries',
    organizationEmail: 'billing@oscorp.com',
    organizationPhone: '+1 (555) 019-2834',
    organizationAddress: '100 Innovation Way, Suite 400, New York, NY 10001',
    organizationTaxNumber: 'US-94829103',
    type: 'CUSTOMER_INVOICE',
    typeName: 'Customer Invoice (Sales)',
    contactName: 'Acme Corporation',
    contactEmail: 'accounts@acmecorp.com',
    contactPhone: '+1 (555) 349-8821',
    contactAddress: '742 Evergreen Terrace, Springfield, OR 97477',
    contactAccountNumber: 'CUST-1001',
    contactTypeInitials: 'CT',
    date: new Date('2026-10-15'),
    dueDate: new Date('2026-11-15'),
    lineAmountTypes: 'EXCLUSIVE',
    status: 'AUTHORISED',
    reference: 'PO-88492',
    currencySymbol: '$',
    lineItems: [
      {
        item: 'Web Development',
        description: 'Frontend architectural setup, navigation, and reactive invoice forms',
        account: 'Sales (200)',
        quantity: 40,
        price: 120.0,
        discount: 5,
        taxRate: 15,
        amount: 4560.0
      },
      {
        item: 'Consulting',
        description: 'Database schema optimization and multi-tenant unique constraint audit',
        account: 'Sales (200)',
        quantity: 10,
        price: 150.0,
        discount: 0,
        taxRate: 15,
        amount: 1500.0
      },
      {
        item: 'Cloud Infrastructure',
        description: 'PostgreSQL instance migration and secure containerized environment provisioning',
        account: 'Office Expenses (420)',
        quantity: 1,
        price: 350.0,
        discount: 0,
        taxRate: 15,
        amount: 350.0
      }
    ],
    subTotal: 6410.0,
    totalDiscount: 240.0,
    totalTax: 961.5,
    grandTotal: 7371.5,
    notes: 'Payment is due within 30 days of invoice date. Please reference the invoice number when making electronic transfer.',
    bankDetails: {
      bankName: 'Silicon Valley Commercial Bank',
      accountName: 'Oscorp Industries Global LLC',
      accountNumber: '4829-1029-4481',
      routingNumber: '021000021',
      swiftBic: 'SVCBUS33'
    }
  };

  ngOnInit(): void {
    if (this.invoice) {
      return;
    }

    // Check if invoice data was passed through router state
    const navState = history.state?.invoiceData as InvoicePreviewData | undefined;
    if (navState) {
      this.invoice = navState;
      return;
    }

    // Check route parameter :id
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      this.invoiceService.getInvoiceById(invoiceId).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const d = res.data;
            this.invoice = {
              id: d.id,
              invoiceNumber: d.invoiceNumber,
              organizationName: d.organizationName || 'Current Organization',
              organizationEmail: d.organizationEmail,
              organizationPhone: d.organizationPhone,
              organizationAddress: d.organizationAddress,
              organizationTaxNumber: d.organizationTaxNumber,
              type: d.type === 'CUSTOMER' ? 'CUSTOMER_INVOICE' : 'SUPPLIER_INVOICE',
              typeName: d.typeName,
              contactName: d.contactName,
              contactEmail: d.contactEmail,
              contactPhone: d.contactPhone,
              contactAddress: d.contactAddress,
              contactAccountNumber: d.contactAccountNumber,
              contactTypeInitials: d.contactTypeInitials,
              date: d.date,
              dueDate: d.dueDate,
              lineAmountTypes: (d.lineAmountTypes as any) || 'EXCLUSIVE',
              status: d.status,
              reference: d.reference,
              currencySymbol: '$',
              lineItems: (d.lineItems || []).map((li: any) => ({
                item: li.description,
                description: li.description,
                account: li.accountCode,
                quantity: li.quantity,
                price: li.unitAmount,
                discount: li.discountRate || 0,
                taxRate: 15,
                amount: li.total || li.lineAmount
              })),
              subTotal: d.subTotal || 0,
              totalTax: Number(d.totalTax) || 0,
              grandTotal: Number(d.grandTotal) || 0,
              notes: 'Payment is due within agreed terms. Please quote invoice number upon remittance.'
            };
          } else {
            this.invoice = this.findMockInvoiceById(invoiceId);
          }
        },
        error: () => {
          this.invoice = this.findMockInvoiceById(invoiceId);
        }
      });
      return;
    }

    // Fallback to rich default invoice
    this.invoice = { ...this.defaultSampleInvoice };
  }

  private findMockInvoiceById(id: string): InvoicePreviewData {
    const mockMap: Record<string, Partial<InvoicePreviewData>> = {
      'inv-001': {
        invoiceNumber: 'INV-00101',
        contactName: 'Acme Corporation',
        contactAccountNumber: 'CUST-1001',
        contactTypeInitials: 'CT',
        status: 'APPROVED',
        subTotal: 1608.7,
        totalTax: 241.3,
        grandTotal: 1850.0
      },
      'inv-002': {
        invoiceNumber: 'INV-00102',
        contactName: 'Globex Industries',
        contactAccountNumber: 'CUST-1002',
        contactTypeInitials: 'CT',
        status: 'DRAFT',
        subTotal: 365.65,
        totalTax: 54.85,
        grandTotal: 420.5
      },
      'inv-003': {
        invoiceNumber: 'INV-00103',
        contactName: 'Initech LLC',
        contactAccountNumber: 'BOTH-1003',
        contactTypeInitials: 'BT',
        status: 'PAID',
        subTotal: 2782.6,
        totalTax: 417.4,
        grandTotal: 3200.0
      },
      'inv-004': {
        invoiceNumber: 'INV-00104',
        contactName: 'Umbrella Trading Co.',
        contactAccountNumber: 'SUPP-1004',
        contactTypeInitials: 'SP',
        type: 'SUPPLIER_INVOICE',
        typeName: 'Supplier Invoice (Bills)',
        status: 'DRAFT',
        subTotal: 826.09,
        totalTax: 123.91,
        grandTotal: 950.0
      },
      'inv-005': {
        invoiceNumber: 'BILL-8891',
        contactName: 'Cyberdyne Systems',
        contactAccountNumber: 'SUPP-1005',
        contactTypeInitials: 'SP',
        type: 'SUPPLIER_INVOICE',
        typeName: 'Supplier Invoice (Bills)',
        status: 'APPROVED',
        subTotal: 2130.43,
        totalTax: 319.57,
        grandTotal: 2450.0
      },
      'inv-006': {
        invoiceNumber: 'BILL-9042',
        contactName: 'Stark Logistics',
        contactAccountNumber: 'BOTH-1006',
        contactTypeInitials: 'BT',
        type: 'SUPPLIER_INVOICE',
        typeName: 'Supplier Invoice (Bills)',
        status: 'PAID',
        subTotal: 4452.17,
        totalTax: 667.83,
        grandTotal: 5120.0
      }
    };

    const found = mockMap[id];
    if (found) {
      return {
        ...this.defaultSampleInvoice,
        id,
        ...found,
        lineItems: this.defaultSampleInvoice.lineItems
      };
    }

    return {
      ...this.defaultSampleInvoice,
      id,
      invoiceNumber: id.toUpperCase().startsWith('INV-') ? id : `INV-${id}`
    };
  }

  getStatusSeverity(status?: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'APPROVED':
      case 'AUTHORISED':
        return 'info';
      case 'SUBMITTED':
        return 'warn';
      case 'VOIDED':
        return 'danger';
      case 'DRAFT':
      default:
        return 'secondary';
    }
  }

  printInvoice(): void {
    window.print();
  }

  downloadPdf(): void {
    window.print();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/main/invoice']);
    }
  }

  editInvoice(): void {
    if (this.invoice?.id) {
      this.router.navigate(['/main/invoice', this.invoice.id]);
    } else {
      this.router.navigate(['/main/invoice/new'], {
        state: { editInvoiceData: this.invoice }
      });
    }
  }

  formatDate(val: string | Date | undefined): string {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

