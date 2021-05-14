import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { State, District, Center } from './cowin.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CowinService {

  constructor(private http: HttpClient) { }

  getStates(): Observable<State[]> {
    return this.http.get(`${environment.apiURL}/v2/admin/location/states`).pipe(
      map(data => data['states'])
    );
  }

  getDistricts(state_id: number): Observable<District[]> {
    return this.http.get(`${environment.apiURL}/v2/admin/location/districts/${state_id}`).pipe(
      map(data => data['districts'])
    );
  }

  getCalendarByDistrict(district_id: string, date: string): Observable<Center[]> {
    return this.http.get(`${environment.apiURL}/v2/appointment/sessions/public/calendarByDistrict?district_id=${district_id}&date=${date}`).pipe(
      map(data => data['centers'])
    );
  }

}
