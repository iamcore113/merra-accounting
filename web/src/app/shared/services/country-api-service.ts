import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestCountryList } from '../models/api_response';

@Injectable({
  providedIn: 'root',
})
export class CountryApiService {
  private readonly apiUrl = 'https://restcountries.com/v3.1/all?fields=name,cca2,currencies';

  constructor(private http: HttpClient) {}

  /**
   * Fetches a list of countries from the REST Countries API
   * @returns Observable array of RestCountry objects
   */
  getCountries(): Observable<RestCountryList> {
    return this.http.get<RestCountryList>(this.apiUrl);
  }
}
