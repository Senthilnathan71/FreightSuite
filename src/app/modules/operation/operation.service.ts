import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { RouteInfo } from "src/app/shared/vertical-sidebar/vertical-sidebar.metadata";
import { Vessel } from "../crm-mobile/Interfaces/vessel.interface";
import { Uom } from "../crm-mobile/Interfaces/uom.interface";
import { HSSAC } from "../crm-mobile/Interfaces/hs-sac.interfaces";
import { State } from "../crm-mobile/Interfaces/state.interface";
import { CheckVoucherPostingMechanism } from "../accounts/accounts.service";

@Injectable({
  providedIn: 'root',
})
export class OperationService {

  constructor(private http: HttpClient) { }

  // Booking Operations
  private loadingPlanData: any;

  setLoadingPlanData(data: any) {
    this.loadingPlanData = data;
  }

  getLoadingPlanData() {
    return this.loadingPlanData;
  }

  clearLoadingPlanData() {
    this.loadingPlanData = null;
  }

  getAuditLogsBooking(tableName: string, recordId?: string) {
    let url = `ff-booking/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  geAuditLogsHouseJob(tableName: string, recordId?: string) {
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

  checkBookingDuplicate(payload : any){
    return this.http.post<{ status: boolean; message: string; data: boolean }>('ff-booking/check-duplicate', payload).pipe(
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
    return this.http.delete<{ status: boolean;data: any }>(`ff-booking/deleteBooking/${BookingHeaderSid}`).pipe(
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
searchHouseJob(payload: any) {  
  return this.http.post<{ data: any[] }>('house-job/search', payload).pipe(
    map((resp) => {
      return resp;
    })
  );
}

  deleteHouseJobProduct(id: number) {
    return this.http.delete<{ data: any }>(`house-job/product/${id}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
  incrementHBLCount(payload: any) {
    return this.http.patch<{ data: any }>(`house-job/hbl-count`,payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteBookingConnection(id: number) {
    return this.http.delete<{ data: any }>(`ff-bookingff-booking/connection/${id}`).pipe(
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

  deleteCostRevenueCharge(CostRevenueChargesSid: number) {
    return this.http.delete<{ data: any }>(`operation-common/delete-cost-revenue/${CostRevenueChargesSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  createBookingRate(payload: any) {
    return this.http.post<{ data: any }>('ff-booking/rates/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateBookingRate(BookingRatesSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`ff-booking/rates/update/${BookingRatesSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getBookingRatesByBookingId(BookingHeaderSid: number) {
    return this.http.get<{ data: any[] }>(`ff-booking/rates/${BookingHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getBookingRatesWithDetails(BookingHeaderSid: number) {
    return this.http.get<{ data: any[] }>(`ff-booking/rates-with-details/${BookingHeaderSid}`).pipe(
      map((resp : any) => {
        return resp;
      })
    );
  }
  getCostRevenueChargeWithDetails(payload: { TransactionSid: number, menuName: string }) {
    return this.http.post<{ data: any[] }>(`operation-common/cost-revenue/fetchWithDetails`, payload).pipe(
      map((resp : any) => {
        return resp;
      })
    );
  }



  generateVoucherFromBooking(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>('voucher/generate-from-booking', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  generateVoucherForJobs(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>('voucher/generate-from-jobs', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  createVoucher(payload: any) {
    return this.http.post<{ status: boolean; message: string | string[]; data: any }>('voucher/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
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
  getAllMappedChargeCreditors(payload) {
    return this.http.post<{ data: any }>('subledgermaster/mapped-charge-creditors', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }
  getAllCoaWithLedgerCategory(payload) {
    return this.http.post<{ data: any }>('coa/ledger-category', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getAllSubledgerByCOA(payload) {
    return this.http.post<{ data: any }>('subledgermaster/fetch-by-coa', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getLedgerDetails(payload) {
    return this.http.post<{ data: any }>('subledgermaster/find-subledger-id', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getSubledgerMasterById(payload) {
    return this.http.post<{ data: any }>('subledgermaster/find-subledger', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getBookingByBookingNumber(BookingNumber: string) {
    return this.http.get<{ data: any }>(`house-job/shiping_Ins/fetch/${BookingNumber}`).pipe(
      map((resp) => {
        let response = resp;
        return response;
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

  getAllCustomers(payload) {
    return this.http.post<{ data: any[] }>('customer', payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getAllCustomersWithBranch(CompanyMasterSid: number) {
    return this.http.post('customer/with-branches', { CompanyMasterSid }).pipe(
      map((resp: any) => {
        console.log(resp)
        let response = resp.data;
        return response;
      })
    )
  }

  getAllSalesman(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('ff-user/salesperson',{CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }


  getCustomerBranchByCustomer(CustomerMasterSid: number) {
    return this.http.get<{ data: any[] }>(`customer-branch/fetch-by/${CustomerMasterSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getVesselsBasedOnPorts(payload) {
    return this.http.post<{ data: any[] }>('voyage/fetchVesselsByPorts', payload).pipe(
      map((resp) => {
        let response = resp
        return response;
      })
    );
  }

  getVoyagesBasedOnVesselAndPort(payload) {
    return this.http.post<{ data: any[] }>('voyage/fetchByVesselAndPorts', payload).pipe(
      map((resp) => {
        let response = resp
        return response;
      })
    );
  }

  getAllContainerTypes() {
    return this.http.get<{ data: any[] }>('container-type').pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllCurrencies() {
    return this.http.get<{ data: any[] }>('currency').pipe(
      map((resp: any) => {
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
    return this.http.post<{ data: any }>(`ff-booking/product-lookup`, payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getAllProducts() {
    return this.http.get<{ data: any[] }>('product').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
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



  getAllBookingRateLookups(payload) {
    return this.http.post<{ data: any }>(`ff-booking/rate-lookup`, payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }
  getBookingARAPData(BookingHeaderSid: number) {
    return this.http.get<{ data: any[] }>(`ff-booking/arap-data/${BookingHeaderSid}`).pipe(
        map((resp: any) => {
            return resp;
        })
    );
}
getMasterJobARAPData(MasterJobSid: number) {
    return this.http.get<{ data: any[] }>(`master-job/arap-data/${MasterJobSid}`).pipe(
        map((resp: any) => {
            return resp;
        })
    );
}
getHouseJobARAPData(HouseJobSid: number) {
    return this.http.get<{ data: any[] }>(`house-job/arap-data/${HouseJobSid}`).pipe(
        map((resp: any) => {
            return resp;
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

  getTariffDetails(payload) {
    return this.http.post<{ data: any }>(`ff-booking/tariffDetails`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
  // Job Close Operations
  searchJobClose(payload: any) {
    return this.http.post<{ data: any[] }>('master-job/job-close/search-list', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getJobCloseDetail(MasterJobSid: number) {
    return this.http.get<any>(`master-job/job-close/detail/${MasterJobSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  saveJobCloseStatus(payload: any) {
    return this.http.patch<any>('master-job/job-close/save', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  // Master Job Operations
  searchMasterJobs(payload: any) {
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

  // Master Job Bulk Upload Operations
  parseExcelForBulkUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ status: boolean; message: string; data: any }>('master-job/bulk-upload/parse', formData).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  processBulkUpload(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>('master-job/bulk-upload/process', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  downloadMasterJobTemplate() {
    return this.http.get('master-job/bulk-upload/template', {
      responseType: 'blob'
    });
  }

  downloadContainerTemplate() {
    return this.http.get('master-job/container/template', {
      responseType: 'blob'
    });
  }

  parseContainerExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ status: boolean; message: string; data: any }>('master-job/container/bulk-upload/parse', formData).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
validateContainerData(payload: {
    containers: any[];
    masterJobSid?: number;
    companyMasterSid: number;
    branchMasterSid: number;
    createdBy: string;
}) {
    return this.http.post<{ status: boolean; message: string; data: any }>(
        'master-job/container/bulk-upload/validate',
        payload
    ).pipe(
        map((resp) => {
            return resp;
        })
    );
}
downloadProductTemplate(masterJobSid: number) {
    return this.http.get(`master-job/download-product-template?masterJobSid=${masterJobSid}`, {
        responseType: 'blob'
    });
}
parseProductExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ status: boolean; message: string; data: any }>('master-job/parse-product-excel', formData).pipe(
        map((resp) => {
            return resp;
        })
    );
}

validateProductData(payload: any): Observable<any> {
  return this .http.post<{ status: boolean; message: string; data: any }>(
      'master-job/validate-product-data',
      payload
  ).pipe(
      map((resp) => {
          return resp;
      })
  );
}
processProductUpload(payload: any): Observable<any> {
  return this .http.post<{ status: boolean; message: string; data: any }>(
      'master-job/process-product-upload',
      payload
  ).pipe(
      map((resp) => {
          return resp;
      })
  );
}
  //cargo-receipt

  getLCLExportBookingById(BookingHeaderSid: number) {
    return this.http.get<{ data: any }>(`cargoreceipt/fetch/${BookingHeaderSid}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  updateBookingProductsById(BookingHeaderSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`cargoreceipt/update/${BookingHeaderSid}`, payload).pipe(
      map((resp) => {
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


  getVesselVoyageBasedOnPorts(payload: any) {
    return this.http.post<{ data: any[] }>('voyage/vesselWithVoyage', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getBookingForLoadingPlan(payload: any) {
    return this.http.post<{ data: any[] }>('loading-plan/get-matching-bookings', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  createMasterJob(payload: any) {
    return this.http.post<{ data: any }>('master-job/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllMasterJobs(payload: any) {
    return this.http.post<{ data: any[] }>('master-job', payload).pipe(
      map((resp:any) => {
        return resp;
      })
    );
  }

  getMasterJobById(payload:any) {
    return this.http.post<{ data: any }>(`master-job/fetch`,payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

// Master-job with All Houses
    getAllHouseJobById(MasterJobSid:number) {
    return this.http.post<{ data: any }>(`master-job/fetch/${MasterJobSid}`,{MasterJobSid}).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateMasterJob(payload: any) {
    return this.http.patch<{ data: any }>('master-job/update', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  detachBooking(BookingHeaderSid: number,userEmail: string) {
    return this.http.delete<{ data: any }>(`master-job/detach/${BookingHeaderSid}`,{
      params: { email: userEmail }
    }).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllContainerActivities() {
    return this.http.get<{ data: any[] }>('container-activity-master').pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  softDeleteMasterJobConnection(MasterJobConnectionSid: number) {
    return this.http.delete<{ data: any }>(`master-job/connection/delete/${MasterJobConnectionSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  softDeleteMasterJobContainer(MasterJobContainerSid: number) {
    return this.http.delete<{ data: any }>(`master-job/container/delete/${MasterJobContainerSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  softDeleteContainerActivity(ContainerActivitySid: number) {
    return this.http.delete<{ data: any }>(`master-job/container-activity/delete/${ContainerActivitySid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
  getAuditLogsmasterjob(tableName: string, recordId?: string) {
    let url = `master-job/audit-logs?tableName=${tableName}`;
    if (recordId) url += `&recordId=${recordId}`;

    return this.http.get<{ data: any }>(url).pipe(
      map((resp) => resp.data)
    );
  }

  getAllDepartments(CompanyMasterSid: number) {
    return this.http.post('department', { CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  getDepartmentByType(CompanyMasterSid: number, type: string[]) {
  return this.http.post<{ data: any[] }>(
    'department/department-type',
    { CompanyMasterSid, type }
  ).pipe(
    map(resp => resp.data || [])
  );
}


  getAllPorts() {
    return this.http.get('port').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  getAllVessels() {
    return this.http.get<{ data: Vessel }>('vessel').pipe(
      map((resp: any) => {
        let response = resp;
        return response
      })
    )
  }
  getAllCarriers(CompanyMasterSid: number) {
    return this.http.post('customer/carrier', { CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  getCustomerByItsType(payload: any) {
    return this.http.post<{ data: any[] }>('customer/customer_type/filter', payload).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }
  getAllAgents(CompanyMasterSid: number) {
    return this.http.post('customer/agent', { CompanyMasterSid }).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  // getAllCFS(CompanyMasterSid: number) {
  //   return this.http.post('customer/cfs',{CompanyMasterSid}).pipe(
  //     map((resp: any) => {
  //       let response = resp.data;
  //       return response;
  //     })
  //   )
  // }

  getPackageTypeUOM() {
    return this.http.get('uom/package-type-uom').pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }
  getUOMsByType(type: string) {
    return this.http.get<{ data: any }>(`uom/uom-type?type=${type}`).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllIMCO() {
    return this.http.get<{ data: any[] }>('imco').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllINCO() {
    return this.http.get<{ data: any[] }>('inco').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllBookingForMerging(payload: any) {
    return this.http.post<{ data: any[] }>('merge-booking/allBookings', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  mergeBooking(payload: any) {
    return this.http.post<{ data: any[] }>('merge-booking/merge', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getHouseJobById(HouseJobSid:number) {
    return this.http.get<{ data: any }>(`house-job/fetch/${HouseJobSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getDueDate(payload: any) {
    return this.http.post<{ data: any }>('credit-request/due-date', payload).pipe(
      map((resp:any) => {
        return resp;
      })
    );
  }

  getChargeTaxForChargeId(ChargeMasterSid: number) {
    return this.http.get<{ data: any }>(`charge/charge-tax/${ChargeMasterSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  // ----- Invoice Operations ----- //

  createInvoice(payload: any) {
    return this.http.post<{ data: any }>('invoice/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllInvoices() {
    return this.http.get<{ data: any[] }>('invoice').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllMasterJobContainers(MasterJobSid: number) {
    return this.http.get<{ data: any[] }>(`house-job/fetch-containers/${MasterJobSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }


  getInvoiceById(VoucherHeaderSid: number) {
    return this.http.get<{ data: any }>(`invoice/fetch/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateInvoiceById(VoucherHeaderSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`invoice/update/${VoucherHeaderSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteInvoiceById(VoucherHeaderSid: number) {
    return this.http.delete<{ data: any }>(`invoice/deleteVoucher/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchInvoices(payload: any) {
    return this.http.post<{ data: any }>('invoice/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  getUninvoicedRevenueCharges(payload: any) {
    return this.http.post<{ status: boolean; data: any[] }>('invoice/uninvoiced-charges', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  sendInvoiceEmail(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>('invoice/send-email', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  createCreditNote(payload: any) {
    return this.http.post<{ data: any }>('credit-note/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllCreditNote() {
    return this.http.get<{ data: any[] }>('credit-note').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getAllInvoice(CompanyMasterSid: number) {
    return this.http.post<{ data: any[] }>('credit-note/invoice', {CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getInvoicesById(VoucherHeaderSid: number) {
    return this.http.get<{ data: any }>(`credit-note/fetch/invoice/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }


  getCreditNoteById(VoucherHeaderSid: number) {
    return this.http.get<{ data: any }>(`credit-note/fetch/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateCreditNoteById(VoucherHeaderSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`credit-note/update/${VoucherHeaderSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteCreditNoteById(VoucherHeaderSid: number) {
    return this.http.delete<{ status: boolean ,data: any }>(`credit-note/deleteVoucher/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchCreditNote(payload: any) {
    return this.http.post<{ data: any }>('credit-note/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }


  createVendorCreditNote(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>('vendor-credit-note/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllVendorCreditNote() {
    return this.http.get<{ status: boolean; data: any[] }>('vendor-credit-note').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getAllVendorInvoice(CompanyMasterSid: number) {
    return this.http.post<{ status: boolean; data: any[] }>('vendor-credit-note/vendor-invoice',{CompanyMasterSid}).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getVendorInvoicesById(VoucherHeaderSid: number) {
    return this.http.get<{ status: boolean; data: any }>(`vendor-credit-note/fetch/vendor-invoice/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getVendorInvoiceByNumber(payload: {
    VoucherNumber: string,
    CompanyMasterSid: number,
    BranchMasterSid: number
  }) {
    return this.http.post<{ status: boolean; data: any }>(`vendor-credit-note/fetch/vendor-invoice`,payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  getInvoiceByNumber(payload: {
    VoucherNumber: string,
    CompanyMasterSid: number,
    BranchMasterSid: number
  }) {
    return this.http.post<{ status: boolean; data: any }>(`credit-note/fetch/invoice`, payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }


  getVendorCreditNoteById(VoucherHeaderSid: number) {
    return this.http.get<{ status: boolean; data: any }>(`vendor-credit-note/fetch/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateVendorCreditNoteById(VoucherHeaderSid: number, payload: any) {
    return this.http.patch<{ status: boolean; data: any }>(`vendor-credit-note/update/${VoucherHeaderSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteVendorCreditNoteById(VoucherHeaderSid: number) {
    return this.http.delete<{ status: boolean; data: any }>(`vendor-credit-note/deleteVoucher/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchVendorCreditNote(payload: any) {
    return this.http.post<{ data: any }>('vendor-credit-note/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }


  // ----- Vendor Invoice Operations ----- //

  createVendorInvoice(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>('vendor-invoice/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllVendorInvoices() {
    return this.http.get<{ status: boolean; data: any[] }>('vendor-invoice').pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getVendorInvoiceById(VoucherHeaderSid: number) {
    return this.http.get<{ status: boolean; data: any }>(`vendor-invoice/fetch/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateVendorInvoiceById(VoucherHeaderSid: number, payload: any) {
    return this.http.patch<{ status: boolean; data: any }>(`vendor-invoice/update/${VoucherHeaderSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteVendorInvoiceById(VoucherHeaderSid: number) {
    return this.http.delete<{ status: boolean; data: any }>(`vendor-invoice/deleteVoucher/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchVendorInvoices(payload: any) {
    return this.http.post<{ status: boolean; data: any }>('vendor-invoice/search-list', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchPendingCosts(criteria: {
    searchType: string;
    searchValue: string;
    vendorSid?: number;
    companyMasterSid: number;
    branchMasterSid: number;
  }): Observable<any> {
    return this.http.post<any>('vendor-invoice/search-pending-costs', criteria).pipe(
      map((resp) => {
        return resp;
      })
    );
  }


  // searchPendingCostsForVendorInvoice(payload: any) {
  //   return this.http.post<{ status: boolean; data: any[] }>('vendor-invoice/search-pending-costs-advanced', payload).pipe(
  //     map((resp) => {
  //       return resp;
  //     })
  //   );
  // } 

  getVendorTDSMapping(vendorId: number) {
    return this.http.get<{ status: boolean; data: any }>(`vendor-invoice/vendor-tds-mapping/${vendorId}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getCountryById(CountryMasterSid: number) {
    return this.http.get<{ status: boolean; data: any }>(`country/${CountryMasterSid}`).pipe(
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
  getAllHssac() {
    return this.http.get<{ data: HSSAC[] }>('hssac').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }
  getAllSuledgermaster() {
    return this.http.get<{ data: any[] }>('subledgermaster').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  getAllUom() {
    return this.http.get('uom').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }
  getAllState() {
    return this.http.get<State>('state').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    );
  }

  getStateById(id: number) {
    return this.http.get<{ data: State }>(`state/fetch/${id}`).pipe(
      map((resp:any) => {
        let response = resp.data;
        return response;
      })
    )
  }
  
  updateHouseById(HouseJobSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`house-job/update/${HouseJobSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
  createHouseJob(payload: any) {
    return this.http.post<{ data: any }>(`house-job/create`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  attachBookingToHouseJob(HouseJobSid: number, payload: any) {
    return this.http.post<{ data: any }>(`master-job/attach`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllBookingForSpliting(payload: any) {
    return this.http.post<{ data: any[] }>('splitbooking/allBookings', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  splitBooking(payload: any) {
    return this.http.post<{ data: any[] }>('splitbooking/split', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getBankDetails(payload) {
    return this.http.post<{ data: any }>('company/bank-details', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchCreditCustomer(params) {
    return this.http.post("credit-request/search-list", params).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  getCustomerById(CustomerMasterSid: number) {
    return this.http.get<{ data: any }>(`credit-request/${CustomerMasterSid}`).pipe(
      map((resp) => {
        console.log('getCustomerById response:', resp);
        return resp;
      })
    );
  }

  getDepartment(payload: any) {
    return this.http.post(`credit-request/fetch/department`, payload).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  getSalesman(payload: any) {
    return this.http.post(`credit-request/fetch/salesperson`, payload).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  createCreditRequest(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>(
      'credit-request/create',
      payload
    ).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateCreditRequest(payload: any) {
    return this.http.patch<{ status: boolean; message: string; data: any }>(
      'credit-request/update',
      payload
    ).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  // Service Job related Operations
  getServiceJobById(HouseJobSid: number) {
    return this.http.get<{ data: any }>(`service-job/fetch/${HouseJobSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  createServiceJob(payload: any) {
    return this.http.post<{ data: any }>('service-job/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateServiceJobById(HouseJobSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`service-job/update/${HouseJobSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchServiceJobs(payload: any) {
    return this.http.post<{ data: any[] }>('service-job/search-list', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

   checkDuplicateServiceJob(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>(
      'service-job/check-duplicate',
      payload
    ).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchOutstandingInvoices(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any[]; }>('accounts/receipt/search-outstanding', payload).pipe(
      map((resp) => resp)
    );
  }
  getHouseJobByMasterJob(payload: any) {
    return this.http.post('house-job/fetchByMaster', payload).pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }

  postVoucherByVoucherSid(payload: any) {
    return this.http.post<{ data: any }>('voucher/post-voucher', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  checkVoucherPostingMechanism(payload: CheckVoucherPostingMechanism) {
    return this.http.post<{ data: boolean }>('voucher/check-auto-posting', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  postJournalVoucher(payload: any) {
    return this.http.post<{ data: any }>('accounts/journal-voucher/post-voucher', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    )
  }

  //BOE

  createBoe(payload: any) {
    return this.http.post<{ data: any }>('boe/create', payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  updateBoeById(BoeSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`boe/update/${BoeSid}`, payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }


  getBoeById(boeSid: number) {
    return this.http.get<{ data: any }>(`boe/${boeSid}`).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getAllBoe() {
    return this.http.get(`boe`).pipe(
      map((resp: any) => {
        return resp.data;
      })
    )
  }

  deleteBoeById(BoeSid: number) {
    return this.http.delete<{ data: any }>(`boe/${BoeSid}`).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }


  // Vehicle
  createVehicle(payload: any) {
    return this.http.post<{ data: any }>('vehicle/create', payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  updateVehicleById(BoeSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`vehicle/update/${BoeSid}`, payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }


  getVehicleById(boeSid: number) {
    return this.http.get<{ data: any }>(`vehicle/${boeSid}`).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getAllVehicle() {
    return this.http.get(`vehicle`).pipe(
      map((resp: any) => {
        return resp.data;
      })
    )
  }

  deleteVehicleById(BoeSid: number) {
    return this.http.delete<{ data: any }>(`vehicle/${BoeSid}`).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  // Customs
  createCustoms(payload: any) {
    return this.http.post<{ data: any }>('customs/create', payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  updateCustomsById(BoeSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`customs/update/${BoeSid}`, payload).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }


  getCustomsById(boeSid: number) {
    return this.http.get<{ data: any }>(`customs/${boeSid}`).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }

  getAllCustoms() {
    return this.http.get(`customs`).pipe(
      map((resp: any) => {
        return resp.data;
      })
    )
  }

  getCustomsByHouseJobSid(houseJobSid: number) {
    return this.http.get<{ data: any[] }>(`customs/house-job/${houseJobSid}`).pipe(
      map((resp) => resp.data)
    );
  }

  getCustomsByMasterJobSid(masterJobSid: number) {
    return this.http.get<{ data: any[] }>(`customs/master-job/${masterJobSid}`).pipe(
      map((resp) => resp.data)
    );
  }

  deleteCustomsById(BoeSid: number) {
    return this.http.delete<{ data: any }>(`customs/${BoeSid}`).pipe(
      map((resp) => {
        return resp.data;
      })
    );
  }
  getAllTaxGroup() {
    return this.http.get<{ data: any[] }>('tax-group', {  }).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    )
  }

  getLedgerForTaxGroup(payload: {
  taxGroup: number | number[];
  InputOrOutput: 'Input' | 'Output';
  TaxCategory: 'Intra' | 'Inter';
  CountryMasterSid: number;
}) {
  return this.http.post<{ data: any[] }>('subledgermaster/tax-group', payload).pipe(
    map((resp: any) => {
      return resp;
    })
  );
}


  createBookingFromMasterJob(payload: any) {
    return this.http.post<{ data: any }>('master-job/booking-create/transhipment', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
createReverseVoucher(payload: any) {
    return this.http.post<{ status: boolean; message: string; data: any }>('reverse-voucher/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  getAllReverseVoucher() {
    return this.http.get<{ status: boolean; data: any[] }>('reverse-voucher').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
  getAllVoucher(CompanyMasterSid:number, BranchMasterSid:number) {
    return this.http.post<{ status: boolean; data: any[] }>('reverse-voucher/voucher' ,{CompanyMasterSid,BranchMasterSid}).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getVoucherById(payload: {
    VoucherNumber: string,
    CompanyMasterSid: number,
    BranchMasterSid: number
  }) {
    return this.http.post<{ status: boolean; data: any }>(`reverse-voucher/fetch/voucher`,payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }


  getReverseVoucherById(VoucherHeaderSid: number) {
    return this.http.get<{ status: boolean; data: any }>(`reverse-voucher/fetch/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateReverseVoucherById(VoucherHeaderSid: number, payload: any) {
    return this.http.patch<{ status: boolean; data: any }>(`reverse-voucher/update/${VoucherHeaderSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  deleteReverseVoucherById(VoucherHeaderSid: number) {
    return this.http.delete<{ status: boolean; data: any }>(`reverse-voucher/deleteVoucher/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchReverseVoucher(payload: any) {
    return this.http.post<{ data: any }>('reverse-voucher/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  searchVoucher(payload: any) {
    return this.http.post<{ data: any }>('voucher-correction/search-list', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }

  findVoucherById(VoucherHeaderSid: number) {
    return this.http.get<{ data: any }>(`voucher-correction/fetch/${VoucherHeaderSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateVoucherById(VoucherHeaderSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`voucher-correction/update/${VoucherHeaderSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  postVoucherSid(payload: any) {
    return this.http.post<{ data: any }>('reverse-voucher/post', payload).pipe(
      map((resp: any) => {
        return resp;
      })
    );
  }

  // EDI Manifest Operations
  generateMasterJobEDIManifest(masterJobSid: number): Observable<string> {
    return this.http.get(`master-job/edi-manifest/${masterJobSid}`, {
      responseType: 'text'
    });
  }

  generateHouseJobEDIManifest(houseJobSid: number): Observable<string> {
    return this.http.get(`house-job/edi-manifest/${houseJobSid}`, {
      responseType: 'text'
    });
  }

  
  getActivityAllocationDashboard() {
  return this.http.get<any>('activity-allocation/metrics');
}

getActivityAllocationResourceSummary(
  mode: 'pending' | 'processed' | 'all',
) {
  return this.http.get<any>(
    `activity-allocation/resource-summary?mode=${mode}`,
  );
}

getActivityAllocationWorkload(page: number, pageSize: number) {
  return this.http.get<any>(
    `activity-allocation/workload-details?mode=pending&page=${page}&pageSize=${pageSize}`,
  );
}

searchActivityAllocationWorkload(
  query: string,
  page: number,
  pageSize: number,
) {
  return this.http.get<any>(
    `activity-allocation/workload-details?mode=pending&search=${encodeURIComponent(
      query,
    )}&page=${page}&pageSize=${pageSize}`,
  );
}

getDefaultBLClausesByDepartment(DepartmentMasterSid: number) {
    return this.http.get(`blclause/bl-clause/${ DepartmentMasterSid }`).pipe(
      map((resp: any) => {
        console.log(resp)
        let response = resp;
        return response;
      })
    )
  }

    getStdCharges(payload) {
    return this.http.post<{ data: any }>(
      `standard-charge/department-wise`,
      payload
    ).pipe(
      map((res) => {
        let response = res;
        return response;
      })
    );
  }

  getMawbStockForHouseJob(payload: {
  customerId: number;
  airlineId: number;
  companyId: number;
  branchId: number;
}){
    return this.http.post<{data:any[]}>('mawb-stock/free-job-stock', payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;  
      })
    ) 
  }

  createAgentMasterAirWaybill(payload: any) {
    return this.http.post<{ data: any }>('agent-master-air-waybill/create', payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  updateAgentMasterAirWaybillById(HouseJobSid: number, payload: any) {
    return this.http.patch<{ data: any }>(`agent-master-air-waybill/update/${HouseJobSid}`, payload).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
  getAgentMasterAirWaybillById(HouseJobSid: number) {
    return this.http.get<{ data: any }>(`agent-master-air-waybill/fetch/${HouseJobSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }
  getAllAgentMasterAirWaybill() {
    return this.http.get<{ data: any[] }>('agent-master-air-waybill').pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  deleteAgentMasterAirWaybillById(HouseJobSid: number) {
    return this.http.delete<{ data: any }>(`agent-master-air-waybill/delete/${HouseJobSid}`).pipe(
      map((resp) => {
        return resp;
      })
    );
  }

  searchAgentMasterAirWaybill(payload: any) {
    return this.http.post<{ data: any }>('agent-master-air-waybill/search', payload).pipe(
      map((resp) => {
        let response = resp;
        return response;
      })
    );
  }





}