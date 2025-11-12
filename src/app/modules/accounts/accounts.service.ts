import { Injectable } from '@angular/core';
import { CurrencyExchange } from '../crm-mobile/Interfaces/currency-exchange.interface';
import { map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  [x: string]: any;

  constructor(private http: HttpClient) { }

  //currency-exchange//
  getAllCurrencyExchange(CompanyMasterSid: number, BranchMasterSid: number) {
    return this.http.post<CurrencyExchange[]>('currency-exchange',{CompanyMasterSid, BranchMasterSid}).pipe(
      map((resp: any) => {
         let response = resp;
        return response;
      })
    );
  }

  searchCurrencyExchangeList(payload: any) {
    return this.http.post("currency-exchange/search-list", payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  getCurrencyExchangeById(id: number) {
    return this.http.get<{ data: CurrencyExchange }>(`currency-exchange/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCurrencyExchange(payload: any) {
    return this.http.post('currency-exchange/Create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCurrencyExchangeById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`currency-exchange/update/${id}`, payload).pipe(
      map((resp) => {
       let response = resp.data;
        return response;
      })
    );
  }

  getExchangeRate(payload) {
    return this.http.post<{ data: any }>('currency-exchange/exchange-rate', payload).pipe(
      map((resp) => {
        return resp;
      })
    )
  }

  deleteCurrencyExchangeById(id: number) {
    return this.http.delete<{ data: any }>(`currency-exchange/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }



  // chart of accounts
  
  getAllCurrencies() {
    return this.http.get<{ data: any }>('currency').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  // Supplier TDS Mapping

  getAllSupplierTDSMapping() {
    return this.http.get<{data : any[]}>('supplier-tds-mapping').pipe(
      map((resp: any) => {
         let response = resp;
        return response;
      })
    );
  }

  getAuditLogsSupplierTDSMapping(tableName: string, recordId?: string) {
    let url = `supplier-tds-mapping/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getSupplierTDSById(id: number) {
    return this.http.get<{ data: any }>(`supplier-tds-mapping/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  createSupplierTDS(payload: any) {
    return this.http.post('supplier-tds-mapping/create', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  updateSupplierTDSById(SupplierTdsMappingSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`supplier-tds-mapping/update/${SupplierTdsMappingSid}`, payload).pipe(
      map((resp) => {
       let response = resp;
        return response;
      })
    );
  }

  deleteSupplierTDSById(SupplierTdsMappingSid: number) {
    return this.http.delete<{ data: any }>(`supplier-tds-mapping/delete/${SupplierTdsMappingSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchSupplierTDS(payload: any) {
    return this.http.post("supplier-tds-mapping/search-list", payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  getAllSuppliers(CompanyMasterSid: number){
    return this.http.post<{data:any}>('customer/suppliers',{CompanyMasterSid}).pipe(
      map((resp:any)=>{
        let response = resp;
        return response;
      })
    )
  }
  getAllTDSSet(CompanyMasterSid:number){
    return this.http.post<{data:any}>('tds',{CompanyMasterSid}).pipe(
      map((resp:any)=>{
        let response = resp;
        return response;
      })
    )
  }

  getCustomerBranchByCusId(CustomerMasterSid:number){
    return this.http.get<{data:any}>(`customer-branch/fetch-by/${CustomerMasterSid}`).pipe(
      map((resp:any)=>{
        let response = resp;
        return response;
      })
    )
  }
  getTDSDetailByHeader(TDSSetHeaderSid:number){
    return this.http.get<{data:any}>(`tds-detail/fetchByHeader/${TDSSetHeaderSid}`).pipe(
      map((resp:any)=>{
        let response = resp;
        return response;
      })
    )
  }

  getRoleMenuPermissions(menuId: number, roleId: number) {
    return this.http.get<{ data: any }>(`role-menu/permissions/${menuId}/${roleId}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getTandCByCondition(payload) {
    return this.http.post<{ data: any[] }>('terms-and-conditions/fetchByCondition', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllDebtorWithCOAMapped(payload: any) {
    return this.http.post<{ data: any }>('subledgermaster/mapped-debtors', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllCreditorWithCOAMapped(payload) {
    return this.http.post<{ data: any }>('subledgermaster/mapped-creditors', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllMappedChargeDebtors(payload) {
    return this.http.post<{ data: any }>('subledgermaster/mapped-charge-debtors', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllLedgersByItsType(payload){
    return this.http.post<{ data: any }>('coa/ledger-type', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllCoaWithLedgerCategory(payload){
    return this.http.post<{ data: any }>('coa/ledger-category', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getLedgerByCOAMasterSid(payload){
    return this.http.post<{ data: any }>('subledgermaster/coa/mapped', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllCostCenters(){
    return this.http.get<{ data: any[] }>('cost-center').pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllProfitCenters(){
    return this.http.get<{ data: any[] }>('profit-center').pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllCharges(CompanyMasterSid: number) {
    return this.http.post('charge', { CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getMasterJobByDepartment(payload:any){
    return this.http.post('master-job/filter-by-department',payload).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getHouseJobByMasterJob(payload:any){
    return this.http.post('house-job/fetchByMaster',payload).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createReceipt(payload: any){
    return this.http.post('accounts/receipt',payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  getReceiptById(payload){
    return this.http.post<{ data: any }>(`accounts/receipt/fetch`,payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  updateReceiptById(voucherHeaderSid: number, payload: any){
    return this.http.patch<{ data: any }>(`accounts/receipt/update/${voucherHeaderSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }
  
}
