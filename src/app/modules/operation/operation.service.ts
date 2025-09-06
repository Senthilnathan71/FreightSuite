import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";
import { RouteInfo } from "src/app/shared/vertical-sidebar/vertical-sidebar.metadata";

@Injectable({
  providedIn: 'root',
})
export class OperationService {

  constructor(private http: HttpClient) { }

  // Booking Operations

  
  getAuditLogsBooking(tableName: string, recordId?: string) {
    let url = `ff-booking/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getAllBookings() {
    return this.http.get<{ data: any[] }>('ff-booking').pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchBooking(payload: any) {
    return this.http.post<{ data: any[] }>('ff-booking/search-list', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getBookingById(BookingHeaderSid: number) {
    return this.http.get<{ data: any }>(`ff-booking/fetch/${BookingHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  createBooking(payload: any) {
    return this.http.post<{ data: any }>('ff-booking/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateBookingById(BookingHeaderSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`ff-booking/update/${BookingHeaderSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteBookingById(BookingHeaderSid: number) {
    return this.http.delete<{ data: any }>(`ff-booking/deleteBooking/${BookingHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteBookingProduct(id: number) {
    return this.http.delete<{ data: any }>(`ff-booking/product/${id}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteBookingConnection(id: number) {
    return this.http.delete<{ data: any }>(`ff-booking/connection/${id}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteBookingRate(BookingRatesSid: number) {
    return this.http.delete<{ data: any }>(`ff-booking/rates/${BookingRatesSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  // Permissions
  getRoleMenuPermissions(menuId: number, roleId: number) {
    return this.http.get<{ data: any }>(`role-menu/permissions/${menuId}/${roleId}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getBookingHeaderLookups(payload) {
    return this.http.post<{ data: any }>(`ff-booking/header-lookup`, payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }
  getAllCustomerRelatedLookups(payload) {
    return this.http.post<{ data: any }>(`ff-booking/customer-lookup`, payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    return this.http.get<{ data: any[] }>(`customer-branch/fetch-by/${CustomerMasterSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getVesselsBasedOnPorts(payload) {
    return this.http.post<{ data: any[] }>('voyage/fetchVesselsByPorts',payload).pipe(
      map((resp) => {
        let response = resp
        return response;
      })
    );
  }

  getVoyagesBasedOnVesselAndPort(payload) {
    return this.http.post<{ data: any[] }>('voyage/fetchByVesselAndPorts',payload).pipe(
      map((resp) => {
        let response = resp
        return response;
      })
    );
  }

  getAllContainerTypes() {
    return this.http.get<{ data: any[] }>('ff-booking/container-type').pipe(
      map((resp) => {
        return resp;
      })
    );
  }
  
  getAllCurrencies() {
    return this.http.get<{ data: any[] }>('ff-booking/currency').pipe(
      map((resp) => {
        let response = resp
        return response;
      })
    );
  }

  getVoyagesByVesselId(VesselMasterSid: number) {
    return this.http.get<{ data: any[] }>(`voyage/fetchByVessel/${VesselMasterSid}`).pipe(
      map((resp) => {
        return resp;
      })
    )
  }

  getAllBookingProductLookups(payload) {
    return this.http.post<{ data: any }>(`ff-booking/product-lookup`,payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getAllMilestones(payload: any) {
  return this.http.post<{ data: any }>(`ff-booking/milestone`, payload).pipe(
    map((resp) => {
      return resp.data;
    })
  );
}

getShipmentMilestones(payload: any) {
  return this.http.post<{ data: any }>(`ff-booking/shipment-milestone`, payload).pipe(
    map((resp) => {
      return resp.data;
    })
  );
}



  getAllBookingRateLookups(payload){
    return this.http.post<{ data: any }>(`ff-booking/rate-lookup`,payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getExchangeRate(payload){
    return this.http.post<{data:any}>('currency-exchange/exchange-rate',payload).pipe(
      map((resp)=>{
        return resp;
      })
    )
  }

  getTariffDetails(payload){
    return this.http.post<{ data: any }>(`ff-booking/tariffDetails`,payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchMasterJobs(payload:any){
    return this.http.post<{ data: any[] }>('master-job/search-list', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteMasterJob(MasterJobSid: number) {
    return this.http.delete<{ data: any }>(`master-job/${MasterJobSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  //cargo-receipt
  
  getLCLExportBookingById(BookingHeaderSid: number) {
    return this.http.get<{ data: any }>(`cargoreceipt/fetch/${BookingHeaderSid}`).pipe(
      map((resp)=> {
        let response = resp.data;
        return response;
      })
    );
  }

  updateBookingProductsById(BookingHeaderSid: number, payload: any) {
    return this.http.patch<{ data: any}>(`cargoreceipt/update/${BookingHeaderSid}`,payload).pipe(
      map((resp)=> {
        let response = resp.data;
        return response;
      })
    )
  }

  search(params) {
    return this.http.post("cargoreceipt/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }
  getCustomerBranchEmail(CustomerBranchSid) {
    return this.http.get<{ data: any }>(`ff-quotation/customer-branch-email/${CustomerBranchSid}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  bookingPrint(payload: any) {
    return this.http.post<{ data: any[] }>('ff-booking/send/email', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

}