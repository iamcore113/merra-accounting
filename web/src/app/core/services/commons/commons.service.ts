import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonsService {

constructor(private _http: HttpClient) { }

getCountries(): Observable<Object> {
  const res = this._http.get('https://restcountries.com/v3.1/all/', {params: {fields: 'name,cca2,idd,currencies'},});
  return res;
}

}
