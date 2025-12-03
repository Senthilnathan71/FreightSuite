import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { Lead } from '../Interfaces/lead.interface';
import { City } from '../Interfaces/city.interface';
import { PreCustomer } from '../Interfaces/preCustomer.interface';
import { CalendarEvent } from 'angular-calendar';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  saveCombinedEvents(events: CalendarEvent<any>[]) {
    throw new Error('Method not implemented.');
  }
private bookingDataSubject = new BehaviorSubject<any>({});
  public bookingData$: Observable<any> = this.bookingDataSubject.asObservable();
  
  constructor(private http: HttpClient) { }
  public quotationData: any = {};
  public bookingData: any = {};

  private voiceEnquiryData: any = {};


 

  getAllPendingMeetings(CompanyMasterSid:number,BranchMasterSid:number) {
    return this.http.post('ff-pre-customer-meeting/pendingMeetings',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

    searchOpportunity(payload) {
    return this.http.post<{ data: any[] }>('ff-pre-customer-meeting/search-Opportunity', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchExistingCustomers(payload) {
    return this.http.post<{ data: any[] }>('customer/search-ExistingCustomers', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsPreCustomerMeeting(tableName: string, recordId?: string) {
    let url = `ff-pre-customer-meeting/fetch/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getAllCity() {
    return this.http.get<City>('region').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllCountries() {
    return this.http.get('auth/country').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }




  getPreCustomerMeeting(id: number) {
    return this.http.get(`ff-pre-customer-meeting/${id}`).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }



  getAllSalesPerson() {
    return this.http.get('user/salesperson').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  createPreCustomerMeeting(payLoad: any) {
    return this.http.put("ff-pre-customer-meeting", payLoad).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  deletePrecustomerMeeting(PrecustomerMeetingSid:number){
    return this.http.delete(`ff-pre-customer-meeting/delete/${PrecustomerMeetingSid}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }


  signUp(payLoad: any) {
    return this.http.post("auth/user/create", payLoad).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getMeetings() {
    return this.http.get('ff-pre-customer-meeting/meetingDate').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getFollowUp(CompanyMasterSid:number,BranchMasterSid:number) {
    return this.http.get(`ff-pre-customer-meeting/followup/meetingDate/${CompanyMasterSid}/${BranchMasterSid}`).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }
  getAllCustomers(CompanyMasterSid:number) {
    return this.http.post('ff-lead/customer',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        console.log(resp)
        let response = resp.data;
        return response;
      })
    )
  }

  getAllCustomersWithBranch(CompanyMasterSid:number) {
    return this.http.post('customer/with-branches',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        console.log(resp)
        let response = resp.data;
        return response;
      })
    )
  }

  getAllVendorSupplier(CompanyMasterSid:number) {
    return this.http.post('customer/suppliers',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllCarrier(CompanyMasterSid: number) {
    return this.http.post('ff-quotation/carrier',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        console.log(resp)
        let response = resp.data;
        return response;
      })
    )
  }


  getAllDepartments(CompanyMasterSid: number) {
    return this.http.post('ff-enquiry/department',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  getAllMasters(CompanyMasterSid:number) {
    return this.http.post('ff-quotation/unit-currency-charge',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getCustomerByItsType(payload : any) {
    return this.http.post<{ data: any[] }>('customer/customer_type/filter', payload).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllCargoTypes(CompanyMasterSid:number) {
    return this.http.post('ff-enquiry/package-type',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  getAllContainerTypes() {
    return this.http.get('container-type').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getAllPackageTypes(CompanyMasterSid:number) {
    return this.http.post('package-type', { CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllWeightUnits() {
    return this.http.get('unit/weight').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllPorts() {
    return this.http.get('port').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  createEnquiry(payload: any) {
    return this.http.post("ff-enquiry", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getAuditLogsEnquiry(tableName: string, recordId?: string) {
    let url = `ff-enquiry/fetch/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }


  createQuotation(payload: any) {
    return this.http.post("ff-quotation", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }


  deleteRoute(id: number) {
    return this.http.delete(`ff-quotation/route/${id}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }


  deleteCharge(id: number) {
    return this.http.delete(`ff-quotation/charge/${id}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }
  deleteCarrier(id: number) {
    return this.http.delete(`ff-quotation/carrier/${id}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  deleteProduct(id: number) {
    return this.http.delete(`ff-quotation/product/${id}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getAllPackageTypeUOM(){
    return this.http.get<{ data: any }>(`uom/package-type-uom`).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllImco(){
    return this.http.get<{ data: any }>(`imco`).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }

  // getAllMeasurementUnit(){
  //   return this.http.get<{ data: any }>(`uom/measurement-uom`).pipe(
  //     map((resp:any) => {
  //       let response = resp;
  //       return response;
  //     })
  //   )
  // }

  // getAllWeightUnit(){
  //   return this.http.get<{ data: any }>(`uom/weight-uom`).pipe(
  //     map((resp:any) => {
  //       let response = resp;
  //       return response;
  //     })
  //   )
  // }
  
  getUOMsByType(type:string){
    return this.http.get<{ data: any }>(`uom/uom-type?type=${type}`).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }

  getExchangeRate(payload) {
    return this.http.post<{ data: any }>('currency-exchange/exchange-rate', payload).pipe(
      map((resp) => {
        return resp;
      })
    )
  }

  updateQuoteById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`ff-quotation/header/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

   getQuote(id: number) {
    return this.http.get<{ data: any }>(`ff-quotation/quote/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllQuotes(CompanyMasterSid: number, BranchMasterSid: number) {
    return this.http.post<any>('ff-quotation',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }


  getQuoteById(id: number) {
    return this.http.get<{ data: any }>(`ff-quotation/header/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchQuotation(param) {
    return this.http.post<{ data: any }>("ff-quotation/search-list", param).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getAllUOMs() {
    return this.http.get<any>('uom').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }


  getAllEnquiries(CompanyMasterSid:number, BranchMasterSid:number) {
    return this.http.post<any>('ff-enquiry/fetch',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getEnquiryById(id: number) {
    return this.http.get<{ data: any }>(`ff-enquiry/header/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateEnquiryById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`ff-enquiry/header/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteEnquiryById(id: number) {
    return this.http.delete<{ data: any }>(`ff-enquiry/header/${id}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchEnquiry(param) {
    return this.http.post<{ data: any }>("ff-enquiry/search-list", param).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  searchPendingEnquiry(param) {
    return this.http.post<{ data: any }>("ff-enquiry/pending-enquiries/search-list", param).pipe(
      map((resp: any) => {
        let response = resp;
        return resp;
      })
    )
  }

  // getAllShippers(CompanyMasterSid: number) {
  //   return this.http.post('customer/shipper',{CompanyMasterSid}).pipe(
  //     map((resp: any) => {
  //       let response = resp;
  //       return response;
  //     })
  //   )
  // }
  // getAllConsignees(CompanyMasterSid:number) {
  //   return this.http.post('customer/consignee',{CompanyMasterSid}).pipe(
  //     map((resp: any) => {
  //       let response = resp;
  //       return response;
  //     })
  //   )
  // }

  // Set, Get, Clear the data fro Quotation

  clearQuotationData() {
    this.quotationData = {};
}

  setQuotationData(data: any) {
    this.quotationData = data;
  }

  getQuotationData() {
    return this.quotationData || {};
  }



  getAllTodo(CompanyMasterSid:number,BranchMasterSid:number) {
    return this.http.post('ff-pre-customer-meeting/lead/todo',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  // LEAD
  fetchAllLeads(payload:any) {
    return this.http.post<{ data: any }>('ff-lead',payload).pipe(
      map((resp:any) => {
        let response = resp;
        return response;
      })
    )
  }

  getLeadById(PreCustomerMasterSid) {
    return this.http.get<{ data: any }>(`ff-lead/fetch/${PreCustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  createNewLead(payload) {
    return this.http.post<{ data: any }>('ff-lead/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateLeadById(PreCustomerMasterSid: number, payload) {
    return this.http.patch<{ data: any }>(`ff-lead/update/${PreCustomerMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteLeadById(PreCustomerMasterSid: number) {
    return this.http.delete<{ data: any }>(`ff-lead/delete/${PreCustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchLead(payload) {
    return this.http.post<{ data: any[] }>('ff-lead/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsLead(tableName: string, recordId?: string) {
    let url = `ff-lead/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getAllCompanies() {
    return this.http.get<{ data: any[] }>('company').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  fetchAllCountries() {
    return this.http.get<{ data: any[] }>('country').pipe(
      map((resp: any) => {
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

  getCityByStateId(StateMasterSid: number) {
    console.log(StateMasterSid,'StateMasterSid')
    return this.http.get<{ data: any[] }>(`city/fetchByState/${StateMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
  // Get all pre-customer meetings
  getAllPreCustomerMeetings(CompanyMasterSid:number, BranchMasterSid:number) {
    return this.http.post<{ data: any[] }>('ff-pre-customer-meeting',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Get pre-customer meeting by ID
  getPreCustomerMeetingById(PreCustomerMeetingSid: number) {
    return this.http.get<{ data: any }>(`ff-pre-customer-meeting/fetch/${PreCustomerMeetingSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Create new pre-customer meeting
  createNewPreCustomerMeeting(payload: any) {
    return this.http.post<{ data: any }>('ff-pre-customer-meeting/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Update pre-customer meeting by ID
  updatePreCustomerMeetingById(PreCustomerMeetingSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`ff-pre-customer-meeting/update/${PreCustomerMeetingSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Delete pre-customer meeting by ID
  deletePreCustomerMeetingById(PreCustomerMeetingSid: number) {
    return this.http.delete<{ data: any }>(`ff-pre-customer-meeting/delete/${PreCustomerMeetingSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Search pre-customer meetings
  searchPreCustomerMeeting(payload: any) {
    return this.http.post<{ data: any[] }>('ff-pre-customer-meeting/search-list', payload).pipe(
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

  getAllProducts() {
    return this.http.get<{ data: any[] }>('product').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  quotationReport(payload: any) {
    return this.http.post<{ data: any[] }>('ff-quotation/send/email', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getTariffDetailsByQuote(payload: any) {
    return this.http.post<{ data: any[] }>('ff-booking/tariffDetails', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllSalesman() {
    return this.http.get<{ data: any[] }>('ff-user/salesperson').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllIncos() {
    return this.http.get<{ data: any[] }>('inco').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllUnits() {
    return this.http.get<{ data: any[] }>('unit').pipe(
      map((resp) => {
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

  getCustomerBranchByCustomerId(CustomerMasterSid: number) {
    return this.http.get<{ data: any }>(`customer-branch/fetch-by/${CustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getCustomerBranchEmail(CustomerBranchSid) {
    return this.http.get<{ data: any }>(`ff-quotation/customer-branch-email/${CustomerBranchSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getAuditLogsQuotation(tableName: string, recordId?: string) {
    let url = `ff-quotation/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  isUserAuthorizer(payload:any) {
    return this.http.post<{ data: any }>(`authority/check-authorizer`,payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getApprovalStatusByMenuAndDocument(menuMasterSid: number, documentSid: number) {
    return this.http.get<{ data: any }>(`authority/approval-status/${menuMasterSid}/${documentSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getTodayFollowup(payload) {
    return this.http.post<{ data: any[] }>('followup/checkForFollowup', payload).pipe(
      map((resp) => {
        return resp;
      })
    )
  }

  // Voice Enquiry Methods
  processVoiceEnquiry(payload: any) {
    return this.http.post<{ data: any }>('ff-enquiry/process-voice', payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  validateVoiceData(payload: any) {
    return this.http.post<{ data: any }>('ff-enquiry/validate-voice-data', payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getVoiceSuggestions(payload: any) {
    return this.http.post<{ data: any }>('ff-enquiry/voice-suggestions', payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  // Voice Enquiry Data Management
  setVoiceEnquiryData(data: any) {
    this.voiceEnquiryData = data;
  }

  getVoiceEnquiryData() {
    return this.voiceEnquiryData || {};
  }

  clearVoiceEnquiryData() {
    this.voiceEnquiryData = {};
  }


  //Existing Customers
   getAllExistingCustomers(payload:any) {
      return this.http.post('customer/existingcustomers',payload).pipe(
        map((resp: any) => {
          let response = resp.data;
          return response;
        })
      );
    }

  getSalespersonOfLead(PreCustomerMasterSid:number){
    return this.http.get('ff-pre-customer-meeting/salespersonForLead/'+PreCustomerMasterSid).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
   getAllCompanyConfigsByCompanyId(companyId: number) {
    return this.http.get<{ data: any }>(`company-config/company/${companyId}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
  
}
