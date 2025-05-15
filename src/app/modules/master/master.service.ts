import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Sector } from '../crm-mobile/Interfaces/sector.interface';
import { State } from '../crm-mobile/Interfaces/state.interface';
import { Country } from '../crm-mobile/Interfaces/country.interface';
import { Port } from '../crm-mobile/Interfaces/port.interface';
import { Unit } from '../crm-mobile/Interfaces/unit.interface';
import { Uom } from '../crm-mobile/Interfaces/uom.interface';
import { City } from '../crm-mobile/Interfaces/city.interface';
import { Zone } from '../crm-mobile/Interfaces/zone.interface';
import { PackageType } from '../crm-mobile/Interfaces/packageType.interface';

@Injectable({
  providedIn: 'root',
})
export class MasterService {
  constructor(private http: HttpClient) { }



  //vessel-master
  searchVesselList(payload) {
    return this.http.post("vessel/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }

  deleteVesselById(id: number) {
    return this.http.delete<{ data: any }>(`vessel/delete/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  //organization-master or customer-master
  searchOrganizationList(payload) {
    return this.http.post("customer/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }


  getAllCustomers() {
    return this.http.get('customer').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getCustomerById(id: number) {
    return this.http.get<{ data: Uom }>(`customer/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCustomer(payload: any) {
    return this.http.post('customer/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCustomerById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`customer/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteOrganizationById(id: number) {
    return this.http.delete<{ data: any }>(`customer/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  //customer-branch

  getAllCustomerBranches() {
    return this.http.get('customer-branch').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getCustomerBranchById(id: number) {
    return this.http.get<{ data: Uom }>(`customer-branch/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCustomerBranch(payload: any) {
    return this.http.post('customer-branch/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCustomerBranchById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`customer-branch/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteCustomerBranchById(id: number) {
    return this.http.delete<{ data: any }>(`customer-branch/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  //customer-branch-contact

  getAllCustomerBranchContacts() {
    return this.http.get('customer-branch-contact').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getCustomerBranchContactById(id: number) {
    return this.http.get<{ data: Uom }>(`customer-branch-contact/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCustomerBranchContact(payload: any) {
    return this.http.post('customer-branch-contact/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCustomerBranchContactById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`customer-branch-contact/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteCustomerBranchContactById(id: number) {
    return this.http.delete<{ data: any }>(`customer-branch-contact/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  //customer-branch-email

  getAllCustomerBranchEmail() {
    return this.http.get('customer-branch-email').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getCustomerBranchEmailById(id: number) {
    return this.http.get<{ data: Uom }>(`customer-branch-email/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCustomerBranchEmail(payload: any) {
    return this.http.post('customer-branch-email/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCustomerBranchEmailById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`customer-branch-email/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteCustomerBranchEmailById(id: number) {
    return this.http.delete<{ data: any }>(`customer-branch-email/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }


  //customer-login

  getAllCustomerLogin() {
    return this.http.get('customer-login').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getCustomerLoginById(id: number) {
    return this.http.get<{ data: Uom }>(`customer-login/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCustomerLogin(payload: any) {
    return this.http.post('customer-login/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCustomerLoginById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`customer-login/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteCustomerLoginById(id: number) {
    return this.http.delete<{ data: any }>(`customer-login/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }




  //department-master

  getDepartmentById(id: number) {
    return this.http.get<{ data: City }>(`department/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createDepartment(payload: any) {
    return this.http.post('department/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateDepartmentById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`department/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAllDepartments() {
    return this.http.get('department').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteDepartmentById(id: number) {
    return this.http.delete<{ data: any }>(`department/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchDepartmentList(payload) {
    return this.http.post("department/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }



  //uom-master
  getAllUom() {
    return this.http.get('uom').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  searchUomList(payload) {
    return this.http.post("uom/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }


  getUomById(id: number) {
    return this.http.get<{ data: Uom }>(`uom/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createUom(payload: any) {
    return this.http.post('uom', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateUomById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`uom/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteUomById(id: number) {
    return this.http.delete<{ data: any }>(`uom/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  //unit-master
  getAllUnits() {
    return this.http.get('unit').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  searchUnitList(payload) {
    return this.http.post("unit/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }

  getUnitById(id: number) {
    return this.http.get<{ data: Unit }>(`unit/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createUnit(payload: any) {
    return this.http.post('unit', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateUnitById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`unit/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteUnitById(id: number) {
    return this.http.delete<{ data: any }>(`unit/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  // state-master
  getAllState() {
    return this.http.get('state').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  getStateById(id: number) {
    return this.http.get<{ data: State }>(`state/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  createState(payload: any) {
    return this.http.post("state/create", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  updateStateById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`state/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  deleteStateById(id: number) {
    return this.http.delete<{ data: any }>(`state/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  //port-master
  getAllPorts() {
    return this.http.get('port').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  searchPortList(payload) {
    return this.http.post("port/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }

  getPortById(id: number) {
    return this.http.get<{ data: Port }>(`port/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createPort(payload: any) {
    return this.http.post('port', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updatePortById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`port/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deletePortById(id: number) {
    return this.http.delete<{ data: any }>(`port/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getAllStateByCountry(CountryMasterSid: any) {
    return this.http
      .get<State>(`state/statesbyCountry/${CountryMasterSid}`)
      .pipe(
        map((resp: any) => {
          let response = resp;
          return response;
        })
      );
  }

  getAllSector() {
    return this.http.get<Sector>('sector').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  //country-master

  getAllCountry() {
    return this.http.get('country').pipe(
      map((resp: any) => {
        let response = resp;
        console.log(response);
        return response;
      })
    );
  }

  getCountryById(id: number) {
    return this.http.get<{ data: Country }>(`country/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCountry(payload: any) {
    return this.http.post('country', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCountryById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`country/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteCountryById(id: number) {
    return this.http.delete<{ data: any }>(`country/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  //city-master

  getAllCity() {
    return this.http.get<City>('city').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getCityById(id: number) {
    return this.http.get<{ data: City }>(`city/cityId/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCity(payload: any) {
    return this.http.post('city/add', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCityById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`city/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteCityById(id: number) {
    return this.http.delete<{ data: any }>(`city/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  // Zone - Master

  getAllZones() {
    return this.http.get<{ data: Zone[] }>(`zone`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getZoneById(id: number) {
    return this.http.get<{ data: Zone }>(`zone/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
  deleteZone(id: number) {
    return this.http.delete<{ data: any }>(`zone/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  updateZoneById(id: number, data: any) {
    return this.http.patch<{ data: any }>(`zone/update/${id}`, data).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createZone(newData: Zone) {
    return this.http.post<{ data: any }>(`zone/create`, newData).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  // Package Type Master

  getAllPackageTypes() {
    return this.http.get<{ data: any }>('package-type').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getPackageTypeById(id: number) {
    return this.http
      .get<{ data: PackageType }>(`package-type/fetch/${id}`)
      .pipe(
        map((resp) => {
          let response = resp.data;
          return response;
        })
      );
  }

  createNewPackageType(newData: any) {
    return this.http.post<{ data: any }>('package-type/create', newData).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  updatePackageTypeById(id: number, newData: any) {
    return this.http
      .patch<{ data: any }>(`package-type/update/${id}`, newData)
      .pipe(
        map((resp) => {
          let response = resp.data;
          return response;
        })
      );
  }

  deletePackageById(id: number) {
    return this.http.delete<{ data: any }>(`package-type/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
}
