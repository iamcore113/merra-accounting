import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ALL_JOURNALS_URL,
  GET_JOURNAL_BY_ID_URL,
  GET_JOURNALS_BY_INVOICE_ID_URL,
} from '../api/journals';
import { IS_AUTHENTICATED } from '../context/auth.token';
import { SuccessResponse } from '../models/api_response';
import { JournalItem } from '../models/journals';

@Injectable({
  providedIn: 'root',
})
export class JournalService {
  private readonly http = inject(HttpClient);

  getAllJournals(): Observable<SuccessResponse<JournalItem[]>> {
    return this.http.get<SuccessResponse<JournalItem[]>>(ALL_JOURNALS_URL, {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  getJournalById(id: string): Observable<SuccessResponse<JournalItem>> {
    return this.http.get<SuccessResponse<JournalItem>>(GET_JOURNAL_BY_ID_URL(id), {
      context: new HttpContext().set(IS_AUTHENTICATED, true),
    });
  }

  getJournalsByInvoiceId(invoiceId: string): Observable<SuccessResponse<JournalItem[]>> {
    return this.http.get<SuccessResponse<JournalItem[]>>(
      GET_JOURNALS_BY_INVOICE_ID_URL(invoiceId),
      {
        context: new HttpContext().set(IS_AUTHENTICATED, true),
      }
    );
  }
}
