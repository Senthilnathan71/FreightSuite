import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { handleError } from 'src/app/common/error-handling/payload-validation-handler';

export interface ResponseData {
  status: boolean;
  data: any;
  message: string;
}

export interface MilestoneTrackerSearchPayload {
  Ref: string;
  Type: 'hbl' | 'mbl' | 'masterjob';
  CompanyMasterSid: number;
  BranchMasterSid: number;
}

export interface MilestoneTrackerFetchPayload {
  HouseJobSid: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
}

export interface MilestoneTrackerSubmitItem {
  MilestoneMasterSid: number;
  MilestoneName: string;
  MilestoneDate: Date;
  Remarks?: string | null;
}

export interface MilestoneTrackerSubmitPayload {
  ShipmentNo: string;
  HouseJobSid: number;
  BookingHeaderSid?: number | null;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  CreatedBy: string;
  Items: MilestoneTrackerSubmitItem[];
}

@Injectable({
  providedIn: 'root',
})
export class MilestoneTrackerService {

  constructor(private http: HttpClient) { }

  searchHouses(payload: MilestoneTrackerSearchPayload): Observable<ResponseData> {
    return this.http.post<ResponseData>('milestone-tracker/search', payload)
      .pipe(catchError((error) => handleError(error)));
  }

  getMilestones(payload: MilestoneTrackerFetchPayload): Observable<ResponseData> {
    return this.http.post<ResponseData>('milestone-tracker/fetch', payload)
      .pipe(catchError((error) => handleError(error)));
  }

  submitMilestones(payload: MilestoneTrackerSubmitPayload): Observable<ResponseData> {
    return this.http.post<ResponseData>('milestone-tracker/submit', payload)
      .pipe(catchError((error) => handleError(error)));
  }
}
