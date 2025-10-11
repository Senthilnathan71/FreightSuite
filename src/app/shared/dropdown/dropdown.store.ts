import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DropdownStore {
    countries = signal<any[]>([]);
    states = signal<any[]>([]);
    currencies = signal<any[]>([]);
    zone = signal<any[]>([]);
    ports = signal<any[]>([]);
    cities = signal<any[]>([]);
    department = signal<any[]>([]);
    customerTypeData = signal<any[]>([]);
    tdsSet = signal<any[]>([]);


    constructor(private http: HttpClient) { }

    loadCountries() {
        if (this.countries().length) return;
        this.http.get<any[]>('country').subscribe((res: any) => this.countries.set(res.data));
    }

    loadDepartments() {
        if (this.department().length) return;
        this.http.get<any[]>('department').subscribe((res: any) => this.department.set(res.data));
    }

    loadPorts() {
        if (this.ports().length) return;
        this.http.get<any[]>('port').subscribe((res: any) => this.ports.set(res.data));
    }

    loadZones() {
        if (this.zone().length) return;
        this.http.get<any[]>('zone').subscribe((res: any) => this.zone.set(res.data));
    }

    loadStates() {
        if (this.states().length) return;
        this.http.get<any[]>('state').subscribe((res: any) => this.states.set(res.data));
    }

    loadCurrencies() {
        if (this.currencies().length) return;
        this.http.get<any[]>('currency').subscribe((res: any) => this.currencies.set(res.data));
    }

    loadCities() {
        if (this.cities().length) return;
        this.http.get<any[]>('cities').subscribe((res: any) => this.cities.set(res.data));
    }

    loadCustomerTypeData(payload: any) {
        // If already loaded, skip
        if (this.customerTypeData().length) return;


        // Call API
        this.http.post<any>('customer/customer_type/filter', payload)
            .subscribe({
                next: (res) => {
                    // Assuming your backend returns { data: [...] }
                    this.customerTypeData.set(res.data);
                },
                error: (err) => {
                    console.error('Error fetching customer types:', err);
                }
            });
    }

    loadtdsSet(CompanyMasterSid) {
        if (this.tdsSet().length) return;
        this.http.post<any>('tds', { CompanyMasterSid }).subscribe((res: any) => this.tdsSet.set(res.data))
    }


    clearCache() {
        this.countries.set([]);
        this.states.set([]);
        this.currencies.set([]);
        this.zone.set([]);
        this.ports.set([]);
        this.cities.set([]);
        this.department.set([]);
        this.customerTypeData.set([])
        this.tdsSet.set([])
    }
}
