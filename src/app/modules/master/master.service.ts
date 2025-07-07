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
import { Commodity } from '../crm-mobile/Interfaces/commodity.interface';
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
    return this.http.post("vessel/search-list",{params}).pipe(
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
    return this.http.get<State>('state').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  searchState(payload) {
    return this.http.post("state/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
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
        let response = resp.data;
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

  getStateByCountryId(CountryMasterSid){
    return this.http.get<{data:any}>(`state/fetchByCountry/${CountryMasterSid}`).pipe(
      map((resp)=>{
        let response = resp;
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
    return this.http.get<{ data:City[] }>('city').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }
  searchCityList(payload) {
    return this.http.post<{ data: City[] }>("city/search-list", payload).pipe(
      map((resp) => {
        let response = resp.data
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
    return this.http.post<{ data: any}>('city/add', payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
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

  getCityByStateId(StateMasterSid:number){
    return this.http.get<{data:any[]}>(`city/fetchByState/${StateMasterSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
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
        let response = resp.data;
        return response;
      })
    );
  }

  createNewZone(payload: Zone) {
    return this.http.post<{ data: any }>(`zone/create`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  searchZonelList(params) {
    return this.http.post("zone/search-list",params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
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

  searchPackageType(payload) {
    return this.http.post<{ data: any }>('package-type/search-list', payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  // Tariff Master

  searchTariff(payload: any) {
    return this.http.post<{ data: any }>(`tariff/search-list`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
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

  getAllTariff() {
    return this.http.get<{ data: any[] }>('tariff').pipe(
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
        return res.data;
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
        let response = resp.data;
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
        return res.data;
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
        return res.data;
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

  //Commodity-master
  getAllCommodity() {
    return this.http.get<Commodity>('commodity').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }
  createNewCommodity(payload: any) {
    return this.http.post<{ data: Commodity }>('commodity/create', payload).pipe(
      map((res) => res.data)
    );
  }


  updateCommodityById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`commodity/update/${id}`, payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }


  deleteCommodityById(id: number) {
    return this.http.delete<{ data: any }>(`commodity/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getCommodityById(id: number) {
    return this.http.get<{ data: Commodity }>(`commodity/fetch/${id}`).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }


  searchCommodity(payload) {
    return this.http.post("commodity/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }

  // Division-master
  getAllDivisions() {
    return this.http.get<{ data: Division[] }>('division').pipe(
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

  searchDivision(payload) {
    return this.http.post("division/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
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

  searchSectors(payload) {
    return this.http.post('sector/search-list', payload).pipe(
      map((res: any) => {
        return res.data;
      })
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

  getAllCharges() {
    return this.http.get('charge').pipe(
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
        return res.data;
      })
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
    return this.http.post("blclause/search-list",params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
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
        return res.data;
      })
    );
  }

  // Product Master

  getAllProduct(){
    return this.http.get<{data:Product[]}>('product').pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  createNewProduct(payload){
    return this.http.post<{data:Product}>('product/create',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getProductById(ProductMasterSid){
    return this.http.get<{data:Product}>(`product/fetch/${ProductMasterSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  updateProductById(ProductMasterSid,payload){
    return this.http.patch<{data:Product}>(`product/update/${ProductMasterSid}`,payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  deleteProductById(ProductMasterSid){
    return this.http.delete<{data:Product}>(`product/delete/${ProductMasterSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  searchProducts(payload){
    return this.http.post<{data:Product[]}>('product/search-list',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }


  
  
  // Charge Group Master

getAllChargeGroups() {
  return this.http.get<{ data: any[] }>('charge-group').pipe(
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

  // Terms And Conditions

  getAllTandC(){
    return this.http.get<{data:any[]}>('terms-and-conditions').pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  createNewTandC(payload){
    return this.http.post<{data:any}>('terms-and-conditions/create',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getTandCById(TermsAndConditionsMasterSid){
    return this.http.get<{data:any}>(`terms-and-conditions/fetch/${TermsAndConditionsMasterSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  updateTandCById(TermsAndConditionsMasterSid,payload){
    return this.http.patch<{data:any}>(`terms-and-conditions/update/${TermsAndConditionsMasterSid}`,payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  deleteTandCById(TermsAndConditionsMasterSid){
    return this.http.delete<{data:any}>(`terms-and-conditions/delete/${TermsAndConditionsMasterSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  searchTandC(payload){
    return this.http.post<{data:any[]}>('terms-and-conditions/search-list',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getTandCByCondition(payload){
    return this.http.post<{data : any[]}>('terms-and-conditions/fetchByCondition',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  // Terms And Conditions Details

  getAllTandCDetail(){
    return this.http.get<{data:any[]}>('terms-and-conditions-detail').pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  createNewTandCDetail(payload){
    return this.http.post<{data:any}>('terms-and-conditions-detail/create',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getTandCDetailById(TermsAndConditionsDetailSid){
    return this.http.get<{data:any}>(`terms-and-conditions-detail/fetch/${TermsAndConditionsDetailSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  updateTandCDetailById(TermsAndConditionsDetailSid,payload){
    return this.http.patch<{data:any}>(`terms-and-conditions-detail/update/${TermsAndConditionsDetailSid}`,payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  deleteTandCDetailById(TermsAndConditionsDetailSid){
    return this.http.delete<{data:any}>(`terms-and-conditions-detail/delete/${TermsAndConditionsDetailSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  searchTandCDetail(payload){
    return this.http.post<{data:any[]}>('terms-and-conditions-detail/search-list',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  // T&C Transaction

  createTandCTransaction(payload){
    return this.http.post<{data:any[]}>('terms-and-conditions/transaction',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  // Sailing Schedule Header
  
  getAllSailingSchedule(){
    return this.http.get<{data:any[]}>('voyage').pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  createNewSailingSchedule(payload){
    return this.http.post<{data:any}>('voyage/create',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getSailingScheduleById(VoyageMasterHeaderSid){
    return this.http.get<{data:any}>(`voyage/fetch/${VoyageMasterHeaderSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  updateSailingScheduleById(VoyageMasterHeaderSid,payload){
    return this.http.patch<{data:any}>(`voyage/update/${VoyageMasterHeaderSid}`,payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  deleteSailingScheduleById(VoyageMasterHeaderSid){
    return this.http.delete<{data:any}>(`voyage/delete/${VoyageMasterHeaderSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  searchSailingSchedule(payload){
    return this.http.post<{data:any[]}>('voyage/search-list',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  specialScheduleSearch(payload){
    return this.http.post<{data:any[]}>('voyage/searchBy',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  // Sailing Schedule Detail

  getAllSailingScheduleDetail(){
    return this.http.get<{data:any[]}>('voyage-detail').pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  createNewSailingScheduleDetail(payload){
    return this.http.post<{data:any}>('voyage-detail/create',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  getSailingScheduleDetailById(VoyageMasterDetailSid){
    return this.http.get<{data:any}>(`voyage-detail/fetch/${VoyageMasterDetailSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  updateSailingScheduleDetailById(VoyageMasterDetailSid,payload){
    return this.http.patch<{data:any}>(`voyage-detail/update/${VoyageMasterDetailSid}`,payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  deleteSailingScheduleDetailById(VoyageMasterDetailSid){
    return this.http.delete<{data:any}>(`voyage-detail/delete/${VoyageMasterDetailSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  searchSailingScheduleDetail(payload){
    return this.http.post<{data:any[]}>('voyage-detail/search-list',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }
 

// Charge Tax Master
getAllChargeTax() {
  return this.http.get<{data: any[]}>('charge-tax').pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

getChargeTaxById(ChargeTaxMasterSid: number) {
  return this.http.get<{data: any}>(`charge-tax/fetch/${ChargeTaxMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

createNewChargeTax(payload: any) {
  return this.http.post<{data: any}>('charge-tax/create', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

updateChargeTaxById(ChargeTaxMasterSid: number, payload: any) {
  return this.http.patch<{data: any}>(`charge-tax/update/${ChargeTaxMasterSid}`, payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

deleteChargeTaxById(ChargeTaxMasterSid: number) {
  return this.http.delete<{data: any}>(`charge-tax/delete/${ChargeTaxMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

searchChargeTax(payload: any) {
  return this.http.post<{data: any[]}>('charge-tax/search-list', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}
// User Master
getAllFfUser() {
  return this.http.get<{data: any[]}>('ff-user').pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

getFfUserById(UserMasterSid: number) {
  return this.http.get<{data: any}>(`ff-user/fetch/${UserMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

createNewFfUser(payload: any) {
  return this.http.post<{data: any}>('ff-user/create', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

updateFfUserById(UserMasterSid: number, payload: any) {
  return this.http.patch<{data: any}>(`ff-user/update/${UserMasterSid}`, payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

deleteFfUserById(UserMasterSid: number) {
  return this.http.delete<{data: any}>(`ff-user/delete/${UserMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

searchFfUser(payload: any) {
  return this.http.post<{data: any[]}>('ff-user/search-list', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

//  User Type
getAllUserType() {
  return this.http.get<{data: any[]}>('user-type').pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

getUserTypeById(UserMasterSid: number) {
  return this.http.get<{data:any}>(`user-type/fetch/${UserMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

createNewUserType(payload: any) {
  return this.http.post<{data: any}>('user-type/create', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

updateUserTypeById(UserMasterSid: number, payload: any) {
  return this.http.patch<{data: any}>(`user-type/update/${UserMasterSid}`, payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

deleteUserTypeById(UserMasterSid: number) {
  return this.http.delete<{data: any}>(`user-type/delete/${UserMasterSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

searchUserType(payload: any) {
  return this.http.post<{data: any[]}>('user-type/search-list', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}


getAllSalesperson() {
  return this.http.get<{data: any[]}>('customer-salesteam/salesperson').pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}
getAllSalesteam() {
  return this.http.get<{data: any[]}>('customer-salesteam').pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

getSalesteamById(CustomerSalesSid: number) {
  return this.http.get<{data: any}>(`customer-salesteam/fetch/${CustomerSalesSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

createNewSalesteam(payload: any) {
  return this.http.post<{data: any}>('customer-salesteam/create', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

updateSalesteamById(CustomerSalesSid: number, payload: any) {
  return this.http.patch<{data: any}>(`customer-salesteam/update/${CustomerSalesSid}`, payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

deleteSalesteamById(CustomerSalesSid: number) {
  return this.http.delete<{data: any}>(`customer-salesteam/delete/${CustomerSalesSid}`).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}

searchSalesteam(payload: any) {
  return this.http.post<{data: any[]}>('customer-salesteam/search-list', payload).pipe(
    map((resp) => {
      let response = resp;
      return response;
    })
  );
}
// milestone-master

getAllMilestones() {
  return this.http.get<{ data: any[] }>('milestone').pipe(
    map((resp) => {
      let response = resp.data;
      return response;
    })
  );
}

searchMilestoneList(payload: any) {
  return this.http.post<{ data: any[] }>('milestone/search-list', payload).pipe(
    map((resp) => {
      let response = resp.data;
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
      let response = resp.data;
      return response;
    })
  );
}

updateMilestoneById(MilestoneMasterSid: number, payload: any) {
  return this.http.patch<{ data: any }>(`milestone/update/${MilestoneMasterSid}`, payload).pipe(
    map((resp) => {
      let response = resp.data;
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
      let response = resp.data;
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
      let response = resp.data;
      return response;
    })
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

getAllDocType() {
  return this.http.get<{ data: any[] }>('document-type').pipe(
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

//Hawb
getAllHawbStocks(){
    return this.http.get<{data:any[]}>('generation').pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  createNewHawbStock(payload){
    return this.http.post<{data:any}>('generation/create', payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  fetchHawbStockById(HawbStockSid){
    return this.http.get<{data:any}>(`generation/fetch/${HawbStockSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  updateHawbStockById(HawbStockSid,payload){
    return this.http.patch<{data:any}>(`generation/update/${HawbStockSid}`,payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  deleteHawbStock(HawbStockSid){
    return this.http.delete<{data:any}>(`generation/delete/${HawbStockSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  searchHawbStock(payload){
    return this.http.post<{data:any[]}>('generation/search-list',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }


  //year

  getAllYears() {
    return this.http.get<Year>('year').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  searchYear(payload: any) {
    return this.http.post<{ data: any }>(`year/search-list`, payload).pipe(
      map((res: any) => {
        return res|| [];
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

  createFavouriteScreen(payload){
    return this.http.post<{data:any}>('favourite-screen/create',payload).pipe(
      map((resp)=>{
        return resp
      })
  )}
  
  deleteFavouriteScreen(path:string){
    return this.http.delete<{data:any}>(`favourite-screen/delete?path=${encodeURIComponent(path)}`).pipe(
      map((resp)=>{
        return resp
      })
  )}

  
  isPathFav(path:string){
    return this.http.get<{data:any}>(`favourite-screen/check?path=${encodeURIComponent(path)}`).pipe(
      map((resp)=>{
        return resp
      })
  )}
  

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
        let response = resp.data;
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
        return res.data;
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
        return res.data;
      })
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

  searchProfitCenter(payload) {
    return this.http.post("profit-center/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    );
  }

}
