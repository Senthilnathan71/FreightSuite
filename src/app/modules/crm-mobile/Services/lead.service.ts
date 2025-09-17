import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Lead } from '../Interfaces/lead.interface';
import { City } from '../Interfaces/city.interface';
import { PreCustomer } from '../Interfaces/preCustomer.interface';

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  constructor(private http: HttpClient) { }
  private quotationData: any = {};
  private voiceEnquiryData: any = {};


  getAllLeads(CompanyMasterSid:number,BranchMasterSid:number) {
    return this.http.post<Lead>('precustomer',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllPendingMeetings(CompanyMasterSid:number,BranchMasterSid:number) {
    return this.http.post('precustomer-meeting/pendingMeetings',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsPreCustomerMeeting(tableName: string, recordId?: string) {
    let url = `precustomer-meeting/fetch/audit-logs?tableName=${tableName}`;
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

  createPreCustomer(payLoad: any) {
    return this.http.put("precustomer", payLoad).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  getPrecustomerById(id: number) {
    return this.http.get<{ data: PreCustomer }>(`precustomer/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getPreCustomerMeeting(id: number) {
    return this.http.get(`precustomer-meeting/${id}`).pipe(
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
    return this.http.put("precustomer-meeting", payLoad).pipe(
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
    return this.http.get('precustomer-meeting/meetingDate').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllCustomers(CompanyMasterSid:number) {
    return this.http.post('precustomer/customer',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        console.log(resp)
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
  updateQuoteById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`ff-quotation/header/${id}`, payload).pipe(
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
        let response = resp.data;
        return response;
      })
    )
  }

  searchEnquiry(param) {
    return this.http.post<{ data: any }>("ff-enquiry/search-list", param).pipe(
      map((resp: any) => {
        let response = resp;
        return resp;
      })
    )
  }

  getAllShippers(CompanyMasterSid: number) {
    return this.http.post('customer/shipper',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }
  getAllConsignees(CompanyMasterSid:number) {
    return this.http.post('customer/consignee',{CompanyMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

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
    return this.http.post('precustomer-meeting/lead/todo',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  // LEAD
  fetchAllLeads() {
    return this.http.get<{ data: any[] }>('lead').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getLeadById(PreCustomerMasterSid) {
    return this.http.get<{ data: any }>(`lead/fetch/${PreCustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createNewLead(payload) {
    return this.http.post<{ data: any }>('lead/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  updateLeadById(PreCustomerMasterSid: number, payload) {
    return this.http.patch<{ data: any }>(`lead/update/${PreCustomerMasterSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteLeadById(PreCustomerMasterSid: number) {
    return this.http.delete<{ data: any }>(`lead/delete/${PreCustomerMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  searchLead(payload) {
    return this.http.post<{ data: any[] }>('lead/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAuditLogsLead(tableName: string, recordId?: string) {
    let url = `lead/audit-logs?tableName=${tableName}`;
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
    return this.http.get<{ data: any[] }>(`city/fetchByState/${StateMasterSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }
  // Get all pre-customer meetings
  getAllPreCustomerMeetings(CompanyMasterSid:number, BranchMasterSid:number) {
    return this.http.post<{ data: any[] }>('pre-customer-meeting',{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Get pre-customer meeting by ID
  getPreCustomerMeetingById(PreCustomerMeetingSid: number) {
    return this.http.get<{ data: any }>(`pre-customer-meeting/fetch/${PreCustomerMeetingSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Create new pre-customer meeting
  createNewPreCustomerMeeting(payload: any) {
    return this.http.post<{ data: any }>('pre-customer-meeting/create', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Update pre-customer meeting by ID
  updatePreCustomerMeetingById(PreCustomerMeetingSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`pre-customer-meeting/update/${PreCustomerMeetingSid}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Delete pre-customer meeting by ID
  deletePreCustomerMeetingById(PreCustomerMeetingSid: number) {
    return this.http.delete<{ data: any }>(`pre-customer-meeting/delete/${PreCustomerMeetingSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  // Search pre-customer meetings
  searchPreCustomerMeeting(payload: any) {
    return this.http.post<{ data: any[] }>('pre-customer-meeting/search-list', payload).pipe(
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

  getAllProducts(CompanyMasterSid:number) {
    return this.http.post<{ data: any[] }>('product', {  CompanyMasterSid}).pipe(
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
    return this.http.post<{ data: any[] }>('ff-quotation/tariffDetails', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllSalesman() {
    return this.http.get<{ data: any[] }>('ff-quotation/salesman').pipe(
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

}
