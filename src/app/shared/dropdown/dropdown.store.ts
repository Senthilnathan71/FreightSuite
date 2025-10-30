import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DropdownStore {
  countries = signal<any[]>([]);
  states = signal<any[]>([]);
  currencies = signal<any[]>([]);
  zone = signal<any[]>([]);
  ports = signal<any[]>([]);
  cities = signal<any[]>([]);
  department = signal<any[]>([]);
  incos = signal<any[]>([]);
  customerTypeData = signal<any[]>([]);
  tdsSet = signal<any[]>([]);
  containerTypes = signal<any[]>([]);
  uomsByType = signal<any[]>([]);
  vesselData = signal<any[]>([]);

  constructor(private http: HttpClient) {}

  loadCountries(): Observable<any[]> {
    if (this.countries().length) return of(this.countries());
    return this.http.get<any>('country').pipe(
      tap((res) => this.countries.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadDepartments(payload: any): Observable<any[]> {
    if (this.department().length) return of(this.department());
    return this.http.post<any>('department', payload).pipe(
      tap((res) => this.department.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadIncos(): Observable<any[]> {
    if (this.incos().length) return of(this.incos());
    return this.http.get<any>('inco').pipe(
      tap((res) => this.incos.set(res.data || [])),
      map((res) => res.data || [])
    );
  } 

  loadPorts(): Observable<any[]> {
    if (this.ports().length) return of(this.ports());
    return this.http.get<any>('port').pipe(
      tap((res) => this.ports.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadContainerTypes(): Observable<any[]> {
    if (this.containerTypes().length) return of(this.containerTypes());
    return this.http.get<any>('ff-booking/container-type').pipe(
      tap((res) => this.containerTypes.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadZones(): Observable<any[]> {
    if (this.zone().length) return of(this.zone());
    return this.http.get<any>('zone').pipe(
      tap((res) => this.zone.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadStates(): Observable<any[]> {
    if (this.states().length) return of(this.states());
    return this.http.get<any>('state').pipe(
      tap((res) => this.states.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadCurrencies(): Observable<any[]> {
    if (this.currencies().length) return of(this.currencies());
    return this.http.get<any>('currency').pipe(
      tap((res) => this.currencies.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadCities(): Observable<any[]> {
    if (this.cities().length) return of(this.cities());
    return this.http.get<any>('cities').pipe(
      tap((res) => this.cities.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadVessels(): Observable<any[]> {
    if (this.vesselData().length) return of(this.vesselData());
    return this.http.get<any>('vessel').pipe(
      tap((res) => this.vesselData.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadCustomerTypeData(payload: any): Observable<any[]> {
    if (this.customerTypeData().length) return of(this.customerTypeData());
    return this.http.post<any>('customer/customer_type/filter', payload).pipe(
      tap((res) => this.customerTypeData.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadtdsSet(CompanyMasterSid: number): Observable<any[]> {
    if (this.tdsSet().length) return of(this.tdsSet());
    return this.http.post<any>('tds', { CompanyMasterSid }).pipe(
      tap((res) => this.tdsSet.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  loadUOMsByType(type: string): Observable<any[]> {
    if (this.uomsByType().length) return of(this.uomsByType());
    return this.http.get<any>(`uom/uom-type?type=${type}`).pipe(
      tap((res) => this.uomsByType.set(res.data || [])),
      map((res) => res.data || [])
    );
  }

  
 


  clearCache() {
    this.countries.set([]);
    this.states.set([]);
    this.currencies.set([]);
    this.zone.set([]);
    this.ports.set([]);
    this.cities.set([]);
    this.department.set([]);
    this.customerTypeData.set([]);
    this.tdsSet.set([]);
    this.containerTypes.set([]);
    this.uomsByType.set([]);
    this.vesselData.set([]);
  }
}
