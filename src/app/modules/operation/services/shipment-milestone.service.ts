import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, throwError } from 'rxjs';
import { getFirstValidationError, handleError, sortValidationErrors } from 'src/app/common/error-handling/payload-validation-handler';
import { CompanyConfigCacheService } from 'src/app/core/services/company-config-cache.service';

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
  HouseJobSid?: number;
  BookingHeaderSid?: number;
}

export interface SafeInsertShipmentMilestone {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  DepartmentName: string;
  JobType: string;
  createdBy: string;
  MilestoneCode: string;
  ShipmentNo: string;
  MilestoneDate?: Date;
  Remarks : string;
  BookingHeaderSid?: number;   // anchor booking-stage milestones (e.g. EXDO) on the booking
  HouseJobSid?: number;
}

export interface InsertMilestoneByMasterJobPayload {
  MasterJobSid: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  MilestoneCode: string;
  MilestoneDate?: Date;
  createdBy: string;
  Remarks?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShipmentMilestoneService {

  /** Company opt-in gate for AUTO milestone insertion — same key/rule as the DB trigger
   *  (milestone_autoinsert_enabled): row missing / blank / 'N' => OFF. */
  private static readonly AUTO_INSERT_CONFIG = 'MilestoneAutoInsertionRequire';

  constructor(
    private http: HttpClient,
    private configCache: CompanyConfigCacheService
  ) { }

  /** ResponseData-shaped no-op so every existing subscriber works unchanged when the gate is OFF. */
  private skippedResponse(): ResponseData {
    return {
      data: null,
      status: true,
      message: 'Milestone auto insertion is disabled for this company'
    };
  }

  /** One in-flight insert per milestone identity. A double-click on a print/download button fires
   *  the capture again before the first response lands; the backend dedup is check-then-insert, so
   *  only a call arriving AFTER the first row commits gets skipped. Concurrent duplicate calls must
   *  therefore share the FIRST HTTP request instead of racing it. The entry clears when the request
   *  settles, so a later genuine call still reaches the backend (which then finds the row). */
  private inFlightInserts = new Map<string, Observable<ResponseData>>();

  private dedupInFlight(key: string, factory: () => Observable<ResponseData>): Observable<ResponseData> {
    const pending = this.inFlightInserts.get(key);
    if (pending) {
      return pending;
    }
    const shared = factory().pipe(
      finalize(() => this.inFlightInserts.delete(key)),
      shareReplay(1),
    );
    this.inFlightInserts.set(key, shared);
    return shared;
  }

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

  softDeleteShipmentMilestone(
    ShipmentMilestoneSid: number,
    CompanyMasterSid: number,
    BranchMasterSid: number
  ): Observable<ResponseData> {
    return this.http.delete<ResponseData>(`shipment-milestone/delete/${ShipmentMilestoneSid}`, {
      params: { CompanyMasterSid, BranchMasterSid }
    })
      .pipe(
        catchError((error) => {
          const formattedError = handleError(error);
          return formattedError;
        })
      );
  }

  safeInsertMilestone(payload: any): Observable<ResponseData> {
    const key = [
      'safe-insert',
      payload?.CompanyMasterSid,
      payload?.BranchMasterSid,
      payload?.HouseJobSid ?? '',
      payload?.BookingHeaderSid ?? '',
      payload?.ShipmentNo ?? '',
      payload?.MilestoneCode,
    ].join('|');
    return this.dedupInFlight(key, () => this.configCache
      .isConfigEnabled(ShipmentMilestoneService.AUTO_INSERT_CONFIG, payload?.CompanyMasterSid)
      .pipe(
        switchMap((enabled) => enabled
          ? this.http
            .post<ResponseData>('shipment-milestone/safe-insert', payload)
            .pipe(
              catchError((error) => {
                const formattedError = handleError(error);
                return formattedError;
              })
            )
          : of(this.skippedResponse()))
      ));
  }

  insertMilestoneByMasterJob(payload: InsertMilestoneByMasterJobPayload): Observable<ResponseData> {
    const key = [
      'master-job',
      payload?.CompanyMasterSid,
      payload?.BranchMasterSid,
      payload?.MasterJobSid,
      payload?.MilestoneCode,
    ].join('|');
    return this.dedupInFlight(key, () => this.configCache
      .isConfigEnabled(ShipmentMilestoneService.AUTO_INSERT_CONFIG, payload?.CompanyMasterSid)
      .pipe(
        switchMap((enabled) => enabled
          ? this.http
            .post<ResponseData>('shipment-milestone/insert-by-master-job', payload)
            .pipe(
              catchError((error) => {
                const formattedError = handleError(error);
                return formattedError;
              })
            )
          : of(this.skippedResponse()))
      ));
  }


}
