import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs';
import { handleError } from 'src/app/common/error-handling/payload-validation-handler';
import { ResponseData } from '../../operation/services/shipment-milestone.service';

export interface FetchOutstandingVouchers {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  LedgerMasterSid: number;
  DrCr: string;
  Skip?: number;
  Take?: number;
  VoucherMatchingDate?: string;
  COAMasterSid?: number;
}

export interface FetchVoucherMatchingByIdDto {
  VoucherMatchingHeaderSid: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
}

export interface CreateStandaloneVoucherMatchingDto {
  CompanyMasterSid: number;
  BranchMasterSid: number;
  VoucherMatchingDate: Date;
  VoucherHeaderSid: number | null;
  PostStatus: string  | null;
  PostDate: Date | null;
  Narration: string;
  Remarks: string;
  SubledgerName: string;
  YearMasterSid: number;
  LocalCurrencyMasterSid: number;
  LocalCurrencyCode: string;
  current_date: Date;
  userEmail: string;
  MatchingDetail: MatchingDetail[];
}


export interface MatchingDetail {
  MatchingDetailSid: number;
  Sno: string | number,
  VoucherMatchingHeaderSid: number;
  VoucherHeaderSid: number;
  VoucherDetailSid: number;
  VoucherTransactionSid: number;
  VoucherNumber: string;
  VoucherType: string;
  VoucherDate: Date;
  DrCr: string;
  CurrencyMasterSid: string | number;
  CurrencyCode: string;
  ExchangeRate: string | number;
  OriginalCurrencyAmount: string | number;
  OriginalLocalAmount: string | number;
  OutstandingCurrencyAmount: string | number;
  OutstandingLocalAmount: string | number;
  MatchingCurrency: number;
  MatchingExRate: number;
  MatchedCurrencyAmount: string | number;
  MatchedLocalAmount: string | number;
  MatchingTDSAmount: number;
  MatchingType: string;
  MatchingTransactionSid: number;
}

export interface UpdateStandaloneVoucherMatchingDto extends CreateStandaloneVoucherMatchingDto {
  VoucherMatchingHeaderSid: number;
}

export interface PostVoucherMatchingDto {
  VoucherMatchingHeaderSid: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  YearMasterSid: number;
  LocalCurrencyMasterSid: number;
  LocalCurrencyCode: string;
  current_date: Date;
  postedBy: string;
}

export interface FetchVoucherMatchingResponse {
  VoucherMatchingHeaderSid: number;
  CompanyMasterSid: number;
  BranchMasterSid: number;
  VoucherMatchingNo: string;
  VoucherMatchingDate: Date;
  Narration : string | null;
  Remarks: string | null;
  VoucherHeaderSid: number | null;
  COAMasterSid: number;
  LedgerName: string | null;
  LedgerType: 'Sy Cr' | 'Sy Dr' | null;
  SubledgerMasterSid: number;
  SubledgerName: string | null;
  PostDate: Date;
  PostStatus: string;
  Status: string;
  MatchingDetail: MatchingDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class VoucherMatchingService {

  constructor(private http: HttpClient) { }

  searchCustomerOutstandingVouchers(payload: FetchOutstandingVouchers) {
    return this.http.post<ResponseData>('voucher-matching/get-outstanding-vouchers', payload)
      .pipe(
        catchError((error) => {
          return handleError(error);
        })
      )
  }

  getVoucherMatchingByHeaderId(payload: FetchVoucherMatchingByIdDto) {
    return this.http.post<ResponseData>('voucher-matching/fetch-by-id', payload)
      .pipe(
        catchError((error) => {
          return handleError(error);
        })
      )
  }

  createStandaloneVoucherMatching(payload: CreateStandaloneVoucherMatchingDto) {
    return this.http.post<ResponseData>('voucher-matching/create', payload)
      .pipe(
        catchError((error) => {
          return handleError(error);
        })
      )
  }

  updateStandaloneVoucherMatching(payload: UpdateStandaloneVoucherMatchingDto) {
    return this.http.post<ResponseData>('voucher-matching/update', payload)
      .pipe(
        catchError((error) => {
          return handleError(error);
        })
      )
  }

  postVoucherMatching(payload: PostVoucherMatchingDto) {
    return this.http.post<ResponseData>('voucher-matching/post', payload)
      .pipe(
        catchError((error) => {
          return handleError(error);
        })
      )
  }

  cancelVoucherMatching(payload: any) {
    return this.http.post<ResponseData>('voucher-matching/cancel', payload)
      .pipe(
        catchError((error) => {
          return handleError(error);
        })
      )
  }

}
