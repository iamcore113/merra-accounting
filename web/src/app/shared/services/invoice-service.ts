import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { INVOICE_METADATA_URL, CHECK_INVOICE_NUMBER_URL, CREATE_INVOICE_URL } from '../api/invoice';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { Config, SuccessResponse } from '../models/api_response';
import { InvoiceMetaDataResponse } from '../models/invoice';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private readonly http = inject(HttpClient);

  getInvoiceMetadata(): Observable<SuccessResponse<InvoiceMetaDataResponse>> {
    return this.http.get<SuccessResponse<InvoiceMetaDataResponse>>(INVOICE_METADATA_URL, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  checkInvoiceNumberExists(invoiceNumber: string): Observable<SuccessResponse<boolean>> {
    return this.http.get<SuccessResponse<boolean>>(CHECK_INVOICE_NUMBER_URL, {
      params: { invoiceNumber },
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  createInvoice(payload: any): Observable<Config> {
    return this.http.post<Config>(CREATE_INVOICE_URL, payload, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }
}
