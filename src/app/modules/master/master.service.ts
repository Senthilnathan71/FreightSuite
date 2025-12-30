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
import { Vessel } from '../crm-mobile/Interfaces/vessel.interface';
import { Branch } from '../crm-mobile/Interfaces/branch.interface';
import { ContainerType } from '../crm-mobile/Interfaces/container-type.interface';
import { Division } from '../crm-mobile/Interfaces/division.interface';
import { HSSAC } from '../crm-mobile/Interfaces/hs-sac.interfaces';
import { Currency } from '../crm-mobile/Interfaces/currency.interface';
import { Charge } from '../crm-mobile/Interfaces/charge.interface';
import { Product } from '../crm-mobile/Interfaces/product.interface';
import { Inco } from '../crm-mobile/Interfaces/inco.intefaces';
import { CostCenter } from '../crm-mobile/Interfaces/cost-center.interfaces';
import { ProfitCenter } from '../crm-mobile/Interfaces/profit-center.interfaces';
import { Year } from '../crm-mobile/Interfaces/year.interfaces';
@Injectable({
  providedIn: 'root',
})
export class MasterService {

  constructor(private http: HttpClient) { }
  //vessel-master
  getAllVessels() {
    return this.http.get<{ data: Vessel }>('vessel').pipe(
      map((resp: any) => {
        let response = resp;
        return response
      })
    )
  }
  searchVesselList(params) {
    return this.http.post("vessel/search-list", params).pipe(
      map((resp: any) => {
        return resp;
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

  createVessel(payload: Vessel) {
    return this.http.post<{ data: Vessel }>(`vessel/create`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  loadVesselById(VesselMasterSid: number) {
    return this.http.get<{ data: Vessel }>(`vessel/fetch/${VesselMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  updateVesselById(VesselMasterSid: number, payload) {
    return this.http.patch<{ data: Vessel }>(`vessel/update/${VesselMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
    getAuditLogsVessel(tableName: string, recordId?: string) {
    let url = `vessel/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  //organization-master or customer-master
  searchOrganizationList(payload) {
    return this.http.post("customer/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }
  searchCustomersByName(payload: {
  CompanyMasterSid: number;
  searchTerm: string;
  excludeCustomerMasterSids?: number[];
}) {
  return this.http.post("customer/search-by-name", payload).pipe(
    map((res: any) => {
      return res;
    })
  );
}

  getAuditLogsCustomer(tableName: string, recordId?: string) {
    let url = `customer/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getAllCustomers(CompanyMasterSid:number) {
    return this.http.post('customer',{CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getAllCustomersWithCustomerBranch(CompanyMasterSid:number) {
    return this.http.post('customer/with-branches',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllCarriers(CompanyMasterSid: number) {
    return this.http.post('customer/carrier',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }
  getAllAgents(CompanyMasterSid: number) {
    return this.http.post('customer/agent',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }
  getAllTransporters(CompanyMasterSid: any) {
    return this.http.post('customer/transporter',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getAllCFS(CompanyMasterSid: number) {
    return this.http.post('customer/cFS',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getCustomerById(id: number) {
    return this.http.get<{ data: any }>(`customer/fetch/${id}`).pipe(
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
    return this.http.get<{ data: any }>(`customer-branch/fetch/${id}`).pipe(
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
    return this.http.get<{ data: any }>(`customer-branch-contact/fetch/${id}`).pipe(
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
    return this.http.get<{ data: any }>(`customer-branch-email/fetch/${id}`).pipe(
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
    return this.http.get<{ data: any }>(`customer-login/fetch/${id}`).pipe(
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

  // Customer Milestone

  getAllCustomerMilestone(CustomerMasterSid:number){
    return this.http.get<{data:any}>(`customer-milestone/fetchByCustomer/${CustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  saveAllCustomerMilestones(payload:any){
    return this.http.post<{data:any[]}>(`customer-milestone/save`,payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteCustomerMilestoneById(CustomerMilestoneSid:number){
    return this.http.delete<{data:any}>(`customer-milestone/delete/${CustomerMilestoneSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getBranchSidsByCustomerMasterSid(CustomerMasterSid: number) {
  return this.http.get<any>(`customer-branch/sids/${CustomerMasterSid}`).pipe(
    map((resp) => {
      return resp.data || [];
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

 getAllDepartments(CompanyMasterSid: number) {
  return this.http.post('department', { CompanyMasterSid }).pipe(
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
        return res;
      })
    );
  }

  getAuditLogs(tableName: string, recordId?: string) {
    let url = `department/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
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

  getUOMsByType(type:string){
    return this.http.get<{ data: any }>(`uom/uom-type?type=${type}`).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }
  
  getChargeUOMBasedOnSegment(segment: 'LCL' | 'FCL' | 'AIR' | 'ALL' = 'ALL') {
  return this.http.get(`uom/charge-uom`, {params: { segment }}).pipe(
    map((resp: any) => {
      return resp.data; 
    })
  );
}

  searchUomList(params) {
    return this.http.post("uom/search-list", params).pipe(
      map((resp: any) => {
        return resp;
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
        let response = resp;
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

    getAuditLogsUom(tableName: string, recordId?: string) {
    let url = `uom/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
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
  searchUnitList(params) {
    return this.http.post("unit/search-list", params).pipe(
      map((resp: any) => {
        return resp;
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
   getAuditLogsUnit(tableName: string, recordId?: string) {
    let url = `unit/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // state-master

  getAllState() {
    return this.http.get<State>('state').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  searchStateList(params) {
    return this.http.post("state/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
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

  editState(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`state/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  softDelete(id: number) {
    return this.http.delete<{ data: any }>(`state/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getStateByCountryId(CountryMasterSid) {
    return this.http.get<{ data: any }>(`state/fetchByCountry/${CountryMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsState(tableName: string, recordId?: string) {
    let url = `state/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
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
  searchPortList(params) {
    return this.http.post("port/search-list", params).pipe(
      map((resp: any) => {
        return resp;
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
    getAuditLogsPort(tableName: string, recordId?: string) {
    let url = `port/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
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
  searchCountries(data): any {
    return this.http.post<{ data: any }>('country/search-list', data).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
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
        let response = resp;
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

  getAuditLogsCountry(tableName: string, recordId?: string) {
    let url = `country/fetch/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  //city-master

  getAllCity() {
    return this.http.get<{ data: City[] }>('city').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }
  searchCityList(payload) {
    return this.http.post<{ data: City[] }>("city/search-list", payload).pipe(
      map((resp) => {
        let response = resp
        return response;
      })
    )
  }

  getCityById(id: number) {
    return this.http.get<{ data: City }>(`city/cityId/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCity(payload: City) {
    return this.http.post<{ data: any }>('city/add', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateCityById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`city/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
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

  getCityByStateId(StateMasterSid: number) {
    return this.http.get<{ data: any[] }>(`city/fetchByState/${StateMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
  getAuditLogsCity(tableName: string, recordId?: string) {
    let url = `city/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  // Zone - Master

  getAllZones() {
    return this.http.get<{ data: Zone[] }>(`zone`).pipe(
      map((resp: any) => {
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
  softDeleteZone(id: number) {
    return this.http.delete<{ data: any }>(`zone/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  updateZoneById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`zone/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewZone(payload: Zone) {
    return this.http.post<{ data: any }>(`zone/create`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchZonelList(params) {
    return this.http.post("zone/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

    getAuditLogsZone(tableName: string, recordId?: string) {
    let url = `zone/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  // Package Type Master

  getAllPackageTypes(CompanyMasterSid: number) {
    return this.http.post<{ data: any }>('package-type',{CompanyMasterSid}).pipe(
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
        let response = resp;
        return response;
      })
    );
  }

  updatePackageTypeById(id: number, newData: any) {
    return this.http
      .patch<{ data: any }>(`package-type/update/${id}`, newData)
      .pipe(
        map((resp) => {
          let response = resp;
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

  searchPackageTypeList(params) {
    return this.http.post("package-type/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

    getAuditLogsPackageType(tableName: string, recordId?: string) {
    let url = `package-type/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // Tariff Master

  searchTariffList(params) {
    return this.http.post("tariff/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  deleteTariffById(TariffHeaderSid: number) {
    return this.http.delete<{
      data: any
    }>(`tariff/delete/${TariffHeaderSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsTariff(tableName: string, recordId?: string) {
    let url = `tariff/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getTariffById(TariffHeaderSid: number) {
    return this.http.get<{ data: any }>(`tariff/fetch/${TariffHeaderSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateTariffById(TariffHeaderSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`tariff/update/${TariffHeaderSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createTariff(payload) {
    return this.http.post<{ data: any }>('tariff/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllTariff(CompanyMasterSid:number) {
    return this.http.post<{ data: any[] }>('tariff',{CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Tariff Detail

  getAllTariffDetail() {
    return this.http.get<{ data: any[] }>('tariff-detail').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getTariffDetailById(TariffDetailSid: number) {
    return this.http.get<{ data: any }>(`tariff-detail/fetch/${TariffDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewTariffDetail(payload) {
    return this.http.post<{ data: any }>(`tariff-detail/create`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateTariffDetailById(TariffDetailSid: number, payload) {
    return this.http.patch<{ data: any }>(`tariff-detail/update/${TariffDetailSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteTariffDetailById(TariffDetailSid: number) {
    return this.http.delete<{ data: any }>(`tariff-detail/delete/${TariffDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }


  searchTariffDetails(payload) {
    return this.http.post<{ data: any }>('tariff-detail/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Branch Master

  searchBranch(payload) {
    return this.http.post<{ data: any }>(`branch/search-list`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllBranches() {
    return this.http.get<{ data: any }>('branch').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getBranchesByCompanyId(CompanyMasterID: number) {
    return this.http.get<{ data: Branch[] }>(`branch/company/${CompanyMasterID}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
 

  deleteBranchById(BranchMasterSid: number) {
    return this.http.delete<{ data: Branch }>(`branch/delete/${BranchMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  loadBranchById(BranchMasterSid: number) {
    return this.http.get<{ data: Branch }>(`branch/fetch/${BranchMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  createBranch(payload) {
    return this.http.post<{ data: Branch }>(`branch/create`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateBranchById(BranchMasterSid: number, payload) {
    return this.http.patch<{ data: Branch }>(`branch/update/${BranchMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Company Master
  getAllCompanies() {
    return this.http.get<{ data: any }>('company').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getAllCompaniesSearch() {
    return this.http.get<{ data: any }>('company/search').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  //company-master
  searchCompanyList(payload) {
    return this.http.post("company/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getCompanyById(id: number) {
    return this.http.get<{ data: any }>(`company/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCompany(payload: any) {
    return this.http.post('company/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCompanyById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`company/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteCompanyById(id: number) {
    return this.http.delete<{ data: any }>(`company/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getAuditLogsCompany(tableName: string, recordId?: string) {
    let url = `company/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
saveCompanyConfig(companyId: number, configData: any) {
  return this.http.post<{ data: any }>(`company/${companyId}/config`, configData).pipe(
    map((resp) => {
      return resp.data;
    })
  );
}

getCompanyConfig(companyId: number) {
  return this.http.get<{ data: any }>(`company/${companyId}/config`).pipe(
    map((resp) => {
      return resp.data;
    })
  );
}

getFieldConfiguration() {
  return this.http.get<{ data: any }>('company/field-configuration').pipe(
    map((resp) => {
      let response = resp.data;
      return response;
    })
  );
}
  // Currency Master
  getAllCurrencies() {
    return this.http.get<{ data: any }>('currency').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  editCurrency(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`currency/update/${id}`, payload).pipe(
    );
  }

  softDeleteCurrency(id: number) {
    return this.http.delete<{ data: any }>(`currency/delete/${id}`).pipe(
    );
  }


  getAllCurrencys() {
    return this.http.get<Currency>('currency').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  searchCurrencyList(payload: any) {
    return this.http.post<{ data: any }>(`currency/search-list`, payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }
  getCurrencyById(TariffHeaderSid: number) {
    return this.http.get<{ data: any }>(`currency/fetch/${TariffHeaderSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }


  createCurrency(payload: any) {
    return this.http.post("currency/create", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }

  getAuditLogsCurrency(tableName: string, recordId?: string) {
    let url = `currency/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  //container-type-master
  getAllContainerTypes() {
    return this.http.get<ContainerType>('container-type').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  searchContainerType(payload: any) {
    return this.http.post<{ data: any }>(`container-type/search-list`, payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getContainerTypeById(id: number) {
    return this.http.get<{ data: ContainerType }>(`container-type/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  addNewContainerType(payload: any) {
    return this.http.post("container-type/create", payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  editContainerTypeById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`container-type/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  deleteContainerTypeById(id: number) {
    return this.http.delete<{ data: any }>(`container-type/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getAuditLogsContainerType(tableName: string, recordId?: string) {
    let url = `container-type/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

 
  // Division-master
  getAllDivisions(CompanyMasterSid: number) {
    return this.http.post<{ data: Division[] }>('division',{ CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getDivisionById(DivisionMasterSid: number) {
    return this.http.get<{ data: Division }>(`division/fetch/${DivisionMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createNewDivision(payload: any) {
    return this.http.post('division/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateDivisionById(DivisionMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`division/update/${DivisionMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })

    )
  }

  deleteDivision(DivisionMasterSid: number) {
    return this.http.delete<{ data: any }>(`division/delete/${DivisionMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchDivisionList(params) {
    return this.http.post("division/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  getAuditLogsDivision(tableName: string, recordId?: string) {
    let url = `division/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }


  //sector-master//

  getSectorById(id: number) {
    return this.http.get<{ data: Sector }>(`sector/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createSector(payload: any) {
    return this.http.post('sector/create', payload).pipe(
      map((res: any) => {
        let response = res;
        return response;
      })
    );
  }

  updateSector(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`sector/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAllSectors() {
    return this.http.get('sector').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteSector(id: number) {
    return this.http.delete<{ data: any }>(`sector/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchSectorList(params) {
    return this.http.post("sector/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }
    getAuditLogsSector(tableName: string, recordId?: string) {
    let url = `sector/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // Branch Bank
  createBranchBank(payload) {
    return this.http.post<{ data: any }>('branch-bank/create', payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getAllBranchBanks() {
    return this.http.get<{ data: any }>('branch-bank').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getBranchBankById(BranchBankSid: number) {
    return this.http.get<{ data: any }>(`branch-bank/fetch/${BranchBankSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  updateBranchBankById(BranchBankSid: number, payload) {
    return this.http.patch<{ data: any }>(`branch-bank/update/${BranchBankSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteBranchBankById(BranchBankSid: number) {
    return this.http.delete<{ data: any }>(`branch-bank/delete/${BranchBankSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  searchBranchBankById(payload) {
    return this.http.post<{ data: any }>('branch-bank/search-list', payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )

  }



  //charge-master//

  getChargeById(ChargeMasterSid: number) {
    return this.http.get<{ data: Charge }>(`charge/fetch/${ChargeMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCharge(payload: any) {
    return this.http.post(`charge/create`, payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateChargeById(ChargeMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`charge/update/${ChargeMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAllCharges(CompanyMasterSid: number) {
    return this.http.post('charge',{ CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  deleteChargeById(id: number) {
    return this.http.delete<{ data: any }>(`charge/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchChargeList(payload) {
    return this.http.post("charge/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }
   getAuditLogsCharge(tableName: string, recordId?: string) {
    let url = `charge/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }



  //  IMCO

  getAllIMCO() {
    return this.http.get<{ data: any[] }>('imco').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getIMCOById(IMCOMasterSid) {
    return this.http.get<{ data: any }>(`imco/fetch/${IMCOMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewIMCO(payload) {
    return this.http.post<{ data: any }>('imco/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateIMCOById(IMCOMasterSid: number, payload) {
    return this.http.patch<{ data: any }>(`imco/update/${IMCOMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteIMCOById(IMCOMasterSid: number) {
    return this.http.delete<{ data: any }>(`imco/delete/${IMCOMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchIMCO(payload) {
    return this.http.post<{ data: any[] }>('imco/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
    getAuditLogsIMCO(tableName: string, recordId?: string) {
    let url = `imco//audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  // Bl - Clause
  getAllBlClause() {
    return this.http.get<{ data: any[] }>('blclause').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getBlClauseById(BlclauseMasterSid) {
    return this.http.get<{ data: any }>(`blclause/fetch/${BlclauseMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewBlClause(payload) {
    return this.http.post<{ data: any }>('blclause/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateBlClauseById(BlclauseMasterSid: number, payload) {
    return this.http.patch<{ data: any }>(`blclause/update/${BlclauseMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteBlclauseById(BlclauseMasterSid: number) {
    return this.http.delete<{ data: any }>(`blclause/delete/${BlclauseMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchBlclauselList(params) {
    return this.http.post("blclause/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  getAuditLogsBlclause(tableName: string, recordId?: string) {
    let url = `blclause/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  // HSSAC-master
  getAllHssac() {
    return this.http.get<{ data: HSSAC[] }>('hssac').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getHssacById(id: number) {
    return this.http.get<{ data: HSSAC }>(`hssac/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createHssac(payload: any) {
    return this.http.post('hssac/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  editHssac(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`hssac/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })

    )
  }

  softDeleteHssac(id: number) {
    return this.http.delete<{ data: any }>(`hssac/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchHssac(payload) {
    return this.http.post("hssac/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }
    getAuditLogsHssac(tableName: string, recordId?: string) {
    let url = `hssac/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // Product Master

  getAllProducts() {
    return this.http.get<{ data: Product[] }>('product').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewProduct(payload) {
    return this.http.post<{ data: Product }>('product/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getProductById(ProductMasterSid) {
    return this.http.get<{ data: Product }>(`product/fetch/${ProductMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateProductById(ProductMasterSid, payload) {
    return this.http.patch<{ data: Product }>(`product/update/${ProductMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteProductById(ProductMasterSid) {
    return this.http.delete<{ data: Product }>(`product/delete/${ProductMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchProductList(params) {
    return this.http.post("product/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

   getAuditLogsProduct(tableName: string, recordId?: string) {
    let url = `product/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }


  // Charge Group Master

  getAllChargeGroups(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('charge-group',{CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getChargeGroupById(ChargeGroupSid: number) {
    return this.http.get<{ data: any }>(`charge-group/fetch/${ChargeGroupSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewChargeGroup(payload: any) {
    return this.http.post<{ data: any }>('charge-group/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateChargeGroupById(ChargeGroupSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`charge-group/update/${ChargeGroupSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteChargeGroupById(ChargeGroupSid: number) {
    return this.http.delete<{ data: any }>(`charge-group/delete/${ChargeGroupSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchChargeGroups(payload: any) {
    return this.http.post<{ data: any[] }>('charge-group/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAuditLogsChargeGroups(tableName: string, recordId?: string) {
    let url = `charge-group/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  // Terms And Conditions

  getAllTandC() {
    return this.http.get<{ data: any[] }>('terms-and-conditions').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
  createNewTandC(payload) {
    return this.http.post<{ data: any }>('terms-and-conditions/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getTandCById(TermsAndConditionsMasterSid) {
    return this.http.get<{ data: any }>(`terms-and-conditions/fetch/${TermsAndConditionsMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateTandCById(TermsAndConditionsMasterSid, payload) {
    return this.http.patch<{ data: any }>(`terms-and-conditions/update/${TermsAndConditionsMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteTandCById(TermsAndConditionsMasterSid) {
    return this.http.delete<{ data: any }>(`terms-and-conditions/delete/${TermsAndConditionsMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchTandC(payload) {
    return this.http.post<{ data: any[] }>('terms-and-conditions/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getTandCByCondition(payload) {
    return this.http.post<{ data: any[] }>('terms-and-conditions/fetchByCondition', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Terms And Conditions Details

  getAllTandCDetail() {
    return this.http.get<{ data: any[] }>('terms-and-conditions-detail').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewTandCDetail(payload) {
    return this.http.post<{ data: any }>('terms-and-conditions-detail/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getTandCDetailById(TermsAndConditionsDetailSid) {
    return this.http.get<{ data: any }>(`terms-and-conditions-detail/fetch/${TermsAndConditionsDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateTandCDetailById(TermsAndConditionsDetailSid, payload) {
    return this.http.patch<{ data: any }>(`terms-and-conditions-detail/update/${TermsAndConditionsDetailSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteTandCDetailById(TermsAndConditionsDetailSid) {
    return this.http.delete<{ data: any }>(`terms-and-conditions-detail/delete/${TermsAndConditionsDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchTandCDetail(payload) {
    return this.http.post<{ data: any[] }>('terms-and-conditions-detail/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // T&C Transaction

  createTandCTransaction(payload) {
    return this.http.post<{ data: any[] }>('terms-and-conditions/transaction', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Sailing Schedule Header

  getAllSailingSchedule() {
    return this.http.get<{ data: any[] }>('voyage').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewSailingSchedule(payload) {
    return this.http.post<{ data: any }>('voyage/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getSailingScheduleById(VoyageMasterHeaderSid) {
    return this.http.get<{ data: any }>(`voyage/fetch/${VoyageMasterHeaderSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateSailingScheduleById(VoyageMasterHeaderSid, payload) {
    return this.http.patch<{ data: any }>(`voyage/update/${VoyageMasterHeaderSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteSailingScheduleById(VoyageMasterHeaderSid) {
    return this.http.delete<{ data: any }>(`voyage/delete/${VoyageMasterHeaderSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsSailingSchedule(tableName: string, recordId?: string) {
    let url = `voyage/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  // searchSailingSchedule(payload) {
  //   return this.http.post<{ data: any[] }>('voyage/search-list', payload).pipe(
  //     map((resp) => {
  //       let response = resp;
  //       return response;
  //     })
  //   )
  // }

  searchSailingSchedule(params) {
    return this.http.post("voyage/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  specialScheduleSearch(payload) {
    return this.http.post<{ data: any[] }>('voyage/searchBy', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Sailing Schedule Detail

  getAllSailingScheduleDetail() {
    return this.http.get<{ data: any[] }>('voyage-detail').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getVoyageDetailByHeader(VoyageMasterHeaderSid: number) {
  return this.http
    .get<{ data: any[] }>(`voyage-detail/fetchByHeader/${VoyageMasterHeaderSid}`)
    .pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
}

  createNewSailingScheduleDetail(payload) {
    return this.http.post<{ data: any }>('voyage-detail/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getSailingScheduleDetailById(VoyageMasterDetailSid) {
    return this.http.get<{ data: any }>(`voyage-detail/fetch/${VoyageMasterDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateSailingScheduleDetailById(VoyageMasterDetailSid, payload) {
    return this.http.patch<{ data: any }>(`voyage-detail/update/${VoyageMasterDetailSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteSailingScheduleDetailById(VoyageMasterDetailSid) {
    return this.http.delete<{ data: any }>(`voyage-detail/delete/${VoyageMasterDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchSailingScheduleDetail(payload) {
    return this.http.post<{ data: any[] }>('voyage-detail/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }


  // Charge Tax Master
  getAllChargeTax(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('charge-tax',{ CompanyMasterSid }).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getChargeTaxById(ChargeTaxMasterSid: number) {
    return this.http.get<{ data: any }>(`charge-tax/fetch/${ChargeTaxMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewChargeTax(payload: any) {
    return this.http.post<{ data: any }>('charge-tax/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateChargeTaxById(ChargeTaxMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`charge-tax/update/${ChargeTaxMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteChargeTaxById(ChargeTaxMasterSid: number) {
    return this.http.delete<{ data: any }>(`charge-tax/delete/${ChargeTaxMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchChargeTax(payload: any) {
    return this.http.post<{ data: any[] }>('charge-tax/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAuditLogsChargeTax(tableName: string, recordId?: string) {
    let url = `charge-tax/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // User Master
  getAllFfUser() {
    return this.http.get<{ data: any[] }>('ff-user').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  getAllDoc(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('ff-user/docs', {CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  getAllCS(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('ff-user/cs',{CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAuditLogsFfUser(tableName: string, recordId?: string) {
    let url = `ff-user/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getFfUserById(UserMasterSid: number) {
    return this.http.get<{ data: any }>(`ff-user/fetch/${UserMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewFfUser(payload: any) {
    return this.http.post<{ data: any }>('ff-user/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateFfUserById(UserMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`ff-user/update/${UserMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getRoleDetailsByCompanyId(payload) {
    return this.http.post<{ data: any }>(`ff-user/role-details`, payload).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteFfUserById(UserMasterSid: number) {
    return this.http.delete<{ data: any }>(`ff-user/delete/${UserMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchFfUserList(params) {
    return this.http.post("ff-user/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  resetUserPassword(UserMasterSid, payload) {
    return this.http.post<{ data: any[] }>(`ff-user/reset/${UserMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  //  User Type
  getAllUserType() {
    return this.http.get<{ data: any[] }>('user-type').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getUserTypeById(UserMasterSid: number) {
    return this.http.get<{ data: any }>(`user-type/fetch/${UserMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewUserType(payload: any) {
    return this.http.post<{ data: any }>('user-type/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateUserTypeById(UserMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`user-type/update/${UserMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteUserTypeById(UserMasterSid: number) {
    return this.http.delete<{ data: any }>(`user-type/delete/${UserMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchUserType(payload: any) {
    return this.http.post<{ data: any[] }>('user-type/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAllSalesmans(CompanyMasterSid: number) {
      return this.http.post<{ data: any[] }>('ff-user/salesperson',{CompanyMasterSid}).pipe(
        map((resp) => {
          let response = resp.data;
          return response;
        })
      )
    }

  getAllSalesteam() {
    return this.http.get<{ data: any[] }>('customer-salesteam').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAllSalespersonOfCustomer(CustomerMasterSid: number) {
    return this.http.get<{ data: any[] }>(`customer-salesteam/customer/${CustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getSalesteamById(CustomerSalesSid: number) {
    return this.http.get<{ data: any }>(`customer-salesteam/fetch/${CustomerSalesSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewSalesteam(payload: any) {
    return this.http.post<{ data: any }>('customer-salesteam/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateSalesteamById(CustomerSalesSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`customer-salesteam/update/${CustomerSalesSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteSalesteamById(CustomerSalesSid: number) {
    return this.http.delete<{ data: any }>(`customer-salesteam/delete/${CustomerSalesSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getCustomerSalesTeam(CustomerMasterSid: number) {
    return this.http.get<{ data: any[] }>(`customer-salesteam/customer/${CustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  saveCustomerSalesTeam(payload: any) {
    return this.http.post<{ data: any[] }>('customer-salesteam/save', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchSalesteam(payload: any) {
    return this.http.post<{ data: any[] }>('customer-salesteam/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  // milestone-master

  getAllMilestones(CompanyMasterSid: number, BranchMasterSid: number) {
    return this.http.post<{ data: any[] }>('milestone',{ CompanyMasterSid, BranchMasterSid }).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchMilestoneList(payload: any) {
    return this.http.post<{ data: any[] }>('milestone/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getMilestoneById(MilestoneMasterSid: number) {
    return this.http.get<{ data: any }>(`milestone/fetch/${MilestoneMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createMilestone(payload: any) {
    return this.http.post<{ data: any }>('milestone/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateMilestoneById(MilestoneMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`milestone/update/${MilestoneMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteMilestoneById(MilestoneMasterSid: number) {
    return this.http.delete<{ data: any }>(`milestone/delete/${MilestoneMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
    getAuditLogsMilestone(tableName: string, recordId?: string) {
    let url = `milestone/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // Authority Master Methods
  getAllAuthorities() {
    return this.http.get<{ data: any[] }>('authority').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getAuthorityById(AuthorityMasterSid: number) {
    return this.http.get<{ data: any }>(`authority/fetch/${AuthorityMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createAuthority(payload: any) {
    return this.http.post<{ data: any }>('authority/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateAuthorityById(AuthorityMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`authority/update/${AuthorityMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteAuthorityById(AuthorityMasterSid: number) {
    return this.http.delete<{ data: any }>(`authority/delete/${AuthorityMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchAuthority(payload: any) {
    return this.http.post<{ data: any[] }>('authority/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

   getAuditLogsAuthority(tableName: string, recordId?: string) {
    let url = `authority/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // Authority Detail Master

  getAllAuthorityDetails() {
    return this.http.get<{ data: any[] }>('authority-detail').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getAuthorityDetailById(AuthorityDetailSid: number) {
    return this.http.get<{ data: any }>(`authority-detail/fetch/${AuthorityDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewAuthorityDetail(payload: any) {
    return this.http.post<{ data: any }>('authority-detail/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateAuthorityDetailById(AuthorityDetailSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`authority-detail/update/${AuthorityDetailSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteAuthorityDetailById(AuthorityDetailSid: number) {
    return this.http.delete<{ data: any }>(`authority-detail/delete/${AuthorityDetailSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchAuthorityDetails(payload: any) {
    return this.http.post<{ data: any[] }>('authority-detail/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  // Document Type Master

  getAllDocType(CompanyMasterSid: number, BranchMasterSid: number) {
    return this.http.post<{ data: any[] }>('document-type',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getDocTypeById(DocumentTypeMasterSid: number) {
    return this.http.get<{ data: any }>(`document-type/fetch/${DocumentTypeMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewDocType(payload: any) {
    return this.http.post<{ data: any }>('document-type/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateDocTypeById(DocumentTypeMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`document-type/update/${DocumentTypeMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteDocTypeById(DocumentTypeMasterSid: number) {
    return this.http.delete<{ data: any }>(`document-type/delete/${DocumentTypeMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchDocTypes(payload: any) {
    return this.http.post<{ data: any[] }>('document-type/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

 getSubledgersByCOA(COAMasterSid: number) {
    return this.http.get<{ data: any[] }>(`document-type/subledgers/${COAMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
}

 getAuditLogsDocTypes(tableName: string, recordId?: string) {
    let url = `document-type/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  //Hawb
  getAllHawbStocks(CompanyMasterSid: number, BranchMasterSid: number) {
    return this.http.post<{ data: any[] }>('hawb-stock',{CompanyMasterSid ,BranchMasterSid }).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewHawbStock(payload) {
    return this.http.post<{ data: any }>('hawb-stock/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  fetchHawbStockById(HawbStockSid) {
    return this.http.get<{ data: any }>(`hawb-stock/fetch/${HawbStockSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateHawbStockById(HawbStockSid, payload) {
    return this.http.patch<{ data: any }>(`hawb-stock/update/${HawbStockSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteHawbStock(HawbStockSid) {
    return this.http.delete<{ data: any }>(`hawb-stock/delete/${HawbStockSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchHawbStock(payload) {
    return this.http.post<{ data: any[] }>('hawb-stock/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

    getAuditLogsHawbStock(tableName: string, recordId?: string) {
    let url = `hawb-stock//audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  //year

  getAllYears(CompanyMasterSid:number) {
    return this.http.post<Year>('year',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  searchYearList(params) {
    return this.http.post("year/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  getYearById(YearMasterSid: number) {
    return this.http.get<{ data: Year }>(`year/fetch/${YearMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  createNewYear(payload: any) {
    return this.http.post("year/create", payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  updateYearById(YearMasterSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`year/update/${YearMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  deleteYearById(YearMasterSid: number) {
    return this.http.delete<{ data: any }>(`year/delete/${YearMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getYearMasterByUserId(email: string) {
    return this.http.get<{ data: any[] }>(`year/user/${email}`).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }

  getFinancialYearsByCompany(companyId: number) {
    return this.http.get<{ data: any[] }>(`year/company/${companyId}`).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsYear(tableName: string, recordId?: string) {
    let url = `year/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  createFavouriteScreen(payload) {
    return this.http.post<{ data: any }>('favourite-screen/create', payload).pipe(
      map((resp) => {
        return resp
      })
    )
  }

  deleteFavouriteScreen(path: string) {
    return this.http.delete<{ data: any }>(`favourite-screen/delete?path=${encodeURIComponent(path)}`).pipe(
      map((resp) => {
        return resp
      })
    )
  }


  isPathFav(path: string) {
    return this.http.get<{ data: any }>(`favourite-screen/check?path=${encodeURIComponent(path)}`).pipe(
      map((resp) => {
        return resp
      })
    )
  }


  //inco-master

  getAllInco() {
    return this.http.get<{ data: Inco[] }>('inco').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getIncoById(id: number) {
    return this.http.get<{ data: Inco }>(`inco/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createInco(payload: any) {
    return this.http.post('inco/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  editInco(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`inco/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })

    )
  }

  softDeleteInco(id: number) {
    return this.http.delete<{ data: any }>(`inco/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchInco(payload) {
    return this.http.post("inco/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  //cost-center-master

  getAllCostCenter() {
    return this.http.get<{ data: CostCenter[] }>('cost-center').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getCostCenterById(id: number) {
    return this.http.get<{ data: CostCenter }>(`cost-center/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCostCenter(payload: any) {
    return this.http.post('cost-center/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  editCostCenter(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`cost-center/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })

    )
  }

  softDeleteCostCenter(id: number) {
    return this.http.delete<{ data: any }>(`cost-center/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchCostCenter(payload) {
    return this.http.post("cost-center/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  getAuditLogsCostCenter(tableName: string, recordId?: string) {
    let url = `cost-center/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  //profit-center-master

  getAllProfitCenter() {
    return this.http.get<{ data: ProfitCenter[] }>('profit-center').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getProfitCenterById(id: number) {
    return this.http.get<{ data: ProfitCenter }>(`profit-center/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createProfitCenter(payload: any) {
    return this.http.post('profit-center/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  editProfitCenter(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`profit-center/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })

    )
  }

  softDeleteProfitCenter(id: number) {
    return this.http.delete<{ data: any }>(`profit-center/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchProfitCenterList(params) {
    return this.http.post("profit-center/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  getAuditLogsProfitCenter(tableName: string, recordId?: string) {
    let url = `profit-center/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  //Tax

  getAllTax() {
    return this.http.get<{ data: any[] }>('tax').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  fetchTaxById(id: number) {
    return this.http.get<{ data: any }>(`tax/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createNewTax(payload: any) {
    return this.http.post('tax/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateTaxById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`tax/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })

    )
  }


  deleteTax(id: number) {
    return this.http.delete<{ data: any }>(`tax/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchTaxGroup(payload) {
    return this.http.post("tax/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  // Chart of accounts


  getAllCoa(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('coa',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


 getAllGroupsByCategory(payload: { Category: string; CompanyMasterSid: number }) {
  return this.http.post<{ data: any[] }>('coa/groups-by-category', payload).pipe(
    map((resp: any) => {
      let response = resp.data;
      return response;
    })
  );
}

// Get all subgroups by group
getAllSubgroupsByGroup(payload: { Category: string; GroupName: string; CompanyMasterSid: number }) {
  return this.http.post<{ data: any[] }>('coa/subgroups-by-group', payload).pipe(
    map((resp: any) => {
      let response = resp.data;
      return response;
    })
  );
}

  fetchCoaById(id: number) {
    return this.http.get<{ data: any }>(`coa/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createNewCoa(payload: any) {
    return this.http.post('coa/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateCoaById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`coa/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })

    )
  }


  deleteCOA(id: number) {
    return this.http.delete<{ data: any }>(`coa/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchCoa(payload) {
    return this.http.post("coa/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  getAuditLogsCOA(tableName: string, recordId?: string) {
    let url = `coa/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

getCoaWithSubledger(CompanyMasterSid: number) {
  return this.http.post<{ data: any[] }>('coa/with-subledger', { CompanyMasterSid }).pipe(
    map((resp: any) => {
      let response = resp.data;
      return response;
    })
  );
}
  getRoleMenuPermissions(menuId: number, roleId: number) {
    return this.http.get<{ data: any }>(`role-menu/permissions/${menuId}/${roleId}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  // Tds Set Header
  getAllTds(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('tds',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  fetchTdsById(id: number) {
    return this.http.get<{ data: any }>(`tds/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewTds(payload: any) {
    return this.http.post('tds/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateTdsById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`tds/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })

    )
  }


  deleteTds(id: number) {
    return this.http.delete<{ data: any }>(`tds/delete/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchTds(payload) {
    return this.http.post("tds/search-list", payload).pipe(
      map((res: any) => {
        let response = res;
        return response
      })
    );
  }

  getAuditLogsTds(tableName: string, recordId?: string) {
    let url = `tds/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  // Tds Set Detail
  getAllTdsSetDetail() {
    return this.http.get<{ data: any[] }>('tds-detail').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  fetchTdsDetailById(id: number) {
    return this.http.get<{ data: any }>(`tds-detail/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  fetchTdsDetailByHeaderId(id: number) {
    return this.http.get<{ data: any }>(`tds-detail/fetchByHeader/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewTdsDetail(payload: any) {
    return this.http.post<{ data: any }>('tds-detail/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateTdsDetailById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`tds-detail/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })

    )
  }


  deleteTdsDetail(id: number) {
    return this.http.delete<{ data: any }>(`tds-detail/delete/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchTdsDetail(payload) {
    return this.http.post<{ data: any }>("tds-detail/search-list", payload).pipe(
      map((res: any) => {
        let response = res;
        return response
      })
    );
  }
  // Tds Set Exemption
  getAllTdsSetExemption() {
    return this.http.get<{ data: any[] }>('tds-exemption').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  fetchTdsExemptionById(id: number) {
    return this.http.get<{ data: any }>(`tds-exemption/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  fetchTdsExemptionByHeaderId(id: number) {
    return this.http.get<{ data: any }>(`tds-exemption/fetchByHeader/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createNewTdsExemption(payload: any) {
    return this.http.post<{ data: any }>('tds-exemption/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateTdsExemptionById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`tds-exemption/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })

    )
  }


  deleteTdsExemption(id: number) {
    return this.http.delete<{ data: any }>(`tds-exemption/delete/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchTdsExemption(payload) {
    return this.http.post<{ data: any }>("tds-exemption/search-list", payload).pipe(
      map((res: any) => {
        let response = res;
        return response
      })
    );
  }


  ///SubledgerMaster


    getAllSuledgermaster() {
    return this.http.get<{ data: any[] }>('subledgermaster').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  fetchSubledgerMasterId(id: number) {
    return this.http.get<{ data: any }>(`subledgermaster/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }


   createNewSubledgerMaster(payload: any) {
    return this.http.post<{ data: any }>('subledgermaster/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateSubledgerMasterById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`subledgermaster/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })

    )
  }


  deleteSudledgerMaster(id: number) {
    return this.http.delete<{ data: any }>(`subledgermaster/delete/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchSubledgerMaster(payload) {
    return this.http.post<{ data: any }>("subledgermaster/search-list", payload).pipe(
      map((res: any) => {
        let response = res;
        return response
      })
    );
  }

  getAuditLogsSubledgerMaster(tableName: string, recordId?: string) {
    let url = `subledgermaster/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }
  
getSubledgerMasterByType(subledgerType: string , CompanyMasterSid: number) {
    return this.http.get<{ data: any[] }>(`subledgermaster/type/${subledgerType}?CompanyMasterSid=${CompanyMasterSid}`).pipe(
        map((resp: any) => {
            return resp;
        })
    );
}

bulkUpdateSubledgerMaster(updates: any[]) {
    return this.http.patch<{ data: any }>('subledgermaster/bulk-update', { updates }).pipe(
        map((resp: any) => {
            return resp;
        })
    );
}
getCOAByLedgerType(LedgerType: string, CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('coa/ledger-type', {LedgerType,CompanyMasterSid}).pipe(
        map((resp: any) => {
            return resp.data;
        })
    );
}

  // Charge TDS Master Methods
  getAllChargeTds() {
  return this.http.get<{ data: any[] }>('charge-tds').pipe(
    map((resp: any) => {
      let response = resp;
      return response;
    })
  );
}

getChargeTdsById(ChargeTdsSid: number) {
  return this.http.get<{ data: any }>(`charge-tds/fetch/${ChargeTdsSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

createNewChargeTds(payload: any) {
  return this.http.post<{ data: any }>('charge-tds/create', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

updateChargeTdsById(ChargeTdsSid: number, payload: any) {
  return this.http.patch<{ data: any }>(`charge-tds/update/${ChargeTdsSid}`, payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

deleteChargeTdsById(ChargeTdsSid: number) {
  return this.http.delete<{ data: any }>(`charge-tds/delete/${ChargeTdsSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

searchChargeTds(payload: any) {
  return this.http.post<{ data: any[] }>('charge-tds/search-list', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

  searchPendingApproval(param, UserMasterSid) {
    return this.http.post<{ data: any }>(`authority/document/search-list/${UserMasterSid}`, param).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  // Container Activity Master Methods
getAllContainerActivities() {
  return this.http.get<{ data: any[] }>('container-activity-master').pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

getContainerActivityById(ContainerActivityMasterSid: number) {
  return this.http.get<{ data: any }>(`container-activity-master/fetch/${ContainerActivityMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

createNewContainerActivity(payload: any) {
  return this.http.post<{ data: any }>('container-activity-master/create', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

updateContainerActivityById(ContainerActivityMasterSid: number, payload: any) {
  return this.http.patch<{ data: any }>(`container-activity-master/update/${ContainerActivityMasterSid}`, payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

deleteContainerActivityById(ContainerActivityMasterSid: number) {
  return this.http.delete<{ data: any }>(`container-activity-master/delete/${ContainerActivityMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

searchContainerActivities(payload: any) {
  return this.http.post<{ data: any[] }>('container-activity-master/search-list', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}
getAuditLogsContainer(tableName: string, recordId?: string) {
    let url = `container-activity-master/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }



  getAllFollowups() {
    return this.http.get<{ data: any[] }>('followup').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
  createFollowup(payload) {
    return this.http.post<{ data: any }>('followup/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getFollowById(followupMasterSid) {
    return this.http.get<{ data: any }>(`followup/fetch/${followupMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateById(followupMasterSid, payload) {
    return this.http.patch<{ data: any }>(`followup/update/${followupMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deletefollowupById(id) {
    return this.http.delete<{ data: any }>(`followup/delete/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

// Report-master

  getReportMasterById(ReportMasterSid: number) {
  return this.http.get<{ data: any }>(`report-master/fetch/${ReportMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

getReportMasterWithParameters(ReportMasterSid: number) {
  return this.http.get<{ data: any }>(`report-master/${ReportMasterSid}/parameters`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

updateReportById(ReportMasterSid: number, payload: any) {
  return this.http.patch<{ data: any }>(`report-master/update/${ReportMasterSid}`, payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}
createReportMaster(payload: any) {
  return this.http.post<{ data: any }>('report-master/create', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

  deleteReportMasterDetail(id: number) {
    return this.http.delete<{ data: any }>(`report-master/delete/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  searchReportMaster(payload: any) {
  return this.http.post<{ data: any[] }>('report-master/search-list', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}
// Menu
 getAllMenu(){
    return this.http.get<{data:any[]}>('menu').pipe(
      map((resp)=>{
        let response = resp.data;
        return response;
      })
    )
  }

  //Mawb
  getAllMawbStocks(CompanyMasterSid: number, BranchMasterSid: number) {
    return this.http.post<{ data: any[] }>('mawb-stock',{CompanyMasterSid ,BranchMasterSid }).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewMawbStock(payload) {
    return this.http.post<{ data: any }>('mawb-stock/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  fetchMawbStockById(MawbStockSid) {
    return this.http.get<{ data: any }>(`mawb-stock/fetch/${MawbStockSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateMawbStockById(MawbStockSid, payload) {
    return this.http.patch<{ data: any }>(`mawb-stock/update/${MawbStockSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteMawbStock(MawbStockSid) {
    return this.http.delete<{ data: any }>(`mawb-stock/delete/${MawbStockSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchMawbStock(payload) {
    return this.http.post<{ data: any[] }>('mawb-stock/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

    getAuditLogsMawbStock(tableName: string, recordId?: string) {
    let url = `mawb-stock//audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;
    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  //Tax-Group
  getAllTaxGroup() {
    return this.http.get<{ data: any[] }>('tax-group', {  }).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewTaxGroup(payload) {
    return this.http.post<{ data: any }>('tax-group/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getTaxGroupById(TaxGroupSid) {
    return this.http.get<{ data: any }>(`tax-group/fetch/${TaxGroupSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateTaxGroupById(TaxGroupSid, payload) {
    return this.http.patch<{ data: any }>(`tax-group/update/${TaxGroupSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteTaxGroupById(TaxGroupSid) {
    return this.http.delete<{ data: any }>(`tax-group/delete/${TaxGroupSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchTaxGroupMaster(payload) {
    return this.http.post<{ data: any[] }>('tax-group/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }


// Get All Networks
getAllNetworks() {
  return this.http.get<{ data: any }>('network-master').pipe(
    map((resp: any) => {
      let response = resp.data;
      return response;
    })
  );
}

getAllNetwork() {
  return this.http.get<{ data: any }>('network-master').pipe(
    map((resp: any) => {
      let response = resp;
      return response;
    })
  );
}

// Create Network
createNetwork(payload: any) {
  return this.http.post('network-master/create', payload).pipe(
    map((res: any) => {
      return res;
    })
  );
}

// Get Network By ID
getNetworkById(id: number) {
  return this.http.get<{ data: any }>(`network-master/fetch/${id}`).pipe(
    map((resp) => {
      let response = resp.data;
      return response;
    })
  );
}

// Update Network By ID
updateNetwork(updates: any[]) {
  return this.http.patch<{ data: any }>(`network-master/bulk-update`, { updates}).pipe(
    map((resp: any) => {
      let response = resp;
      return response;
    })
  );
}

// Delete Network By ID
deleteNetworkById(id: number) {
  return this.http.delete<{ data: any }>(`network-master/delete/${id}`).pipe(
    map((resp) => {
      let response = resp.data;
      return response;
    })
  );
}

// Search Network List
searchNetworkList(params: any) {
  return this.http.post("network-master/search-list", params).pipe(
    map((resp: any) => {
      return resp;
    })
  );
}

// Get Network by Type
getNetworkByType(type: string) {
  return this.http.get(`network-master/network-type?type=${type}`).pipe(
    map((resp: any) => {
      let response = resp.data;
      return response;
    })
  );
}

// Get Audit Logs for Network
getAuditLogsNetwork(tableName: string, recordId?: string) {
  let url = `network-master/audit-logs?tableName=${tableName}`;
  if (recordId) url += `&recordId=${recordId}`;

  return this.http.get<{ data: any }>(url).pipe(
    map((resp) => resp.data)
  );
}

 // Company Configuration
  getAllCompanyConfigsByCompanyId(companyId: number) {
    return this.http.get<{ data: any }>(`company-config/company/${companyId}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getCompanyConfigById(id: number) {
    return this.http.get<{ data: any }>(`company-config/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCompanyConfig(payload: any) {
    return this.http.post('company-config/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  createBulkCompanyConfigs(payload: any[]) {
    return this.http.post('company-config/bulk-create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCompanyConfigById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`company-config/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  deleteCompanyConfigById(id: number) {
    return this.http.delete<{ data: any }>(`company-config/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  bulkUpdateCompanyConfigs(payload: any) {
    return this.http.post('company-config/bulk-update', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  getConfigurationValue(companyId: number, configName: string) {
    return this.http.get<{ data: any }>(`company-config/value/${companyId}/${configName}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
}


