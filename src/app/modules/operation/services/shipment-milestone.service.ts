import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { getFirstValidationError, handleError, sortValidationErrors } from 'src/app/common/error-handler.helper';

export interface ResponseData {
  status: boolean;
  data: any;
  message: string;
}

export interface ShipmentMilestonePayload {
  ShipmentNo: string;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  CreatedOn: Date;
  CreatedBy: string;
  UpdatedOn: Date;
  UpdatedBy: string;
  Status: string;
  MilestoneMasterSid: number;
  MilestoneName: string;
  MilestoneDate: Date;
  AutoCaptured: boolean;
  Remarks: string;
  deletedAt: Date;
  HouseJobSid: number;
}

export interface ShipmentMilestoneDTO extends ShipmentMilestonePayload {
  ShipmentMilestoneSid: number;
}

export interface FetchShipmentMilestone {
  ShipmentNo: string;
  CompanyMasterSid: number;
  BranchMasterSid: number;
}

export interface ShipmentMilestoneFetchWithCode {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  DepartmentName: string;
  JobType: string;
  MilestoneCode: string;
}

export interface CheckExistMilestonePayload {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  ShipmentNo: string;
  MilestoneMasterSid: number;
}

export interface SafeInsertShipmentMilestone {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  DepartmentName: string;
  JobType: string;
  createdBy: string;
  MilestoneCode: string;
  ShipmentNo: string;
  Remarks : string;
}

@Injectable({
  providedIn: 'root'
})
export class ShipmentMilestoneService {

  constructor(private http: HttpClient) { }

  getShipmentMilestoneByShipmentNo(
    payload: FetchShipmentMilestone
  ): Observable<ResponseData> {
    return this.http.post<ResponseData>('shipment-milestone/fetch', payload)
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }

  createShipmentMilestone(
    payload: ShipmentMilestonePayload
  ): Observable<ResponseData> {
    return this.http.post<ResponseData>('shipment-milestone/create', payload)
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }

  updateShipmentMilestone(
    ShipmentMilestoneSid: number,
    payload: ShipmentMilestonePayload
  ): Observable<ResponseData> {
    return this.http.patch<ResponseData>(`shipment-milestone/update/${ShipmentMilestoneSid}`, payload)
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }

  getMilestoneByCode(payload: ShipmentMilestoneFetchWithCode): Observable<ResponseData> {
    return this.http.post<ResponseData>('shipment-milestone/fetch-by-code', payload)
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }

  checkIfAlreadyMilestoneExist(payload: CheckExistMilestonePayload): Observable<ResponseData> {
    return this.http.post<ResponseData>('shipment-milestone/check-existence', payload)
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }

  softDeleteShipmentMilestone(ShipmentMilestoneSid: number): Observable<ResponseData> {
    return this.http.delete<ResponseData>(`shipment-milestone/delete/${ShipmentMilestoneSid}`)
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }

  safeInsertMilestone(payload: any): Observable<ResponseData> {
    return this.http
      .post<ResponseData>('shipment-milestone/safe-insert', payload)
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }


}
