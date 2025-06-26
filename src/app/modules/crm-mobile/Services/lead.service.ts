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


  getAllLeads() {
    return this.http.get<Lead>('precustomer').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllPendingMeetings() {
    return this.http.get('precustomer-meeting/pendingMeetings').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
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

  getAllCustomers() {
    return this.http.get('precustomer/customer').pipe(
      map((resp: any) => {
        console.log(resp)
        let response = resp.data;
        return response;
      })
    )
  }

  getAllCarrier() {
    return this.http.get('quotation/carrier').pipe(
      map((resp: any) => {
        console.log(resp)
        let response = resp.data;
        return response;
      })
    )
  }


  getAllDepartments() {
    return this.http.get('enquiry/department').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  getAllMasters() {
    return this.http.get('quotation/unit-currency-charge').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllCargoTypes() {
    return this.http.get('enquiry/package-type').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  getAllContainerTypes() {
    return this.http.get('enquiry/container-type').pipe(
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
    return this.http.post("enquiry", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }


  createQuotation(payload: any) {
    return this.http.post("quotation", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }


  deleteRoute(id: number) {
    return this.http.delete(`quotation/route/${id}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }


  deleteCharge(id: number) {
    return this.http.delete(`quotation/charge/${id}`).pipe(
      map((res: any) => {
        return res;
      })
    )
  }
  updateQuoteById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`quotation/header/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllQuotes() {
    return this.http.get<any>('quotation').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }


  getQuoteById(id: number) {
    return this.http.get<{ data: any }>(`quotation/header/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }


  getAllEnquiries() {
    return this.http.get<any>('enquiry').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getEnquiryById(id: number) {
    return this.http.get<{ data: any }>(`enquiry/header/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  updateEnquiryById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`enquiry/header/${id}`, payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  deleteEnquiryById(id: number) {
    return this.http.delete<{ data: any }>(`enquiry/header/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
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

  getAllTodo() {
    return this.http.get('precustomer-meeting/lead/todo').pipe(
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

  getAllCompanies(){
    return this.http.get<{data:any[]}>('company').pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  fetchAllCountries(){
    return this.http.get<{data:any[]}>('country').pipe(
      map((resp:any)=>{
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
  
  getCityByStateId(StateMasterSid:number){
    return this.http.get<{data:any[]}>(`city/fetchByState/${StateMasterSid}`).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }
   // Get all pre-customer meetings
  getAllPreCustomerMeetings() {
    return this.http.get<{ data: any[] }>('pre-customer-meeting').pipe(
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

  
  getTandCByCondition(payload){
    return this.http.post<{data : any[]}>('terms-and-conditions/fetchByCondition',payload).pipe(
      map((resp)=>{
        let response = resp;
        return response;
      })
    )
  }

  

}
