import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { OperationService } from '../../operation.service';

export type ArApMode = 'master-job' | 'house-job' | 'booking';
export type ArApVoucherFilter = 'all' | 'REVENUE' | 'COST';
export type ArApStatusFilter = 'all' | 'P' | 'U';

export interface ArApTotals {
  revenueAmount: number;
  revenueLocalAmount: number;
  costAmount: number;
  costLocalAmount: number;
  rowCount: number;
}

export interface ArApRow {
  CompanyMasterSid?: number;
  VoucherHeaderSid: number;
  VoucherNumber?: string;
  VoucherDate?: string | Date;
  DocumentTypeCode?: string;
  CurrencyCode?: string;
  Amount?: number;
  LocalAmount?: number;
  HBLNo?: string;
  MBLNo?: string;
  PostStatus?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ArApService {
  constructor(private operationService: OperationService) {}

  loadData(mode: ArApMode, documentId: number): Observable<ArApRow[]> {
    const request$ = mode === 'booking'
      ? this.operationService.getBookingARAPData(documentId)
      : mode === 'house-job'
        ? this.operationService.getHouseJobARAPData(documentId)
        : this.operationService.getMasterJobARAPData(documentId);

    return request$.pipe(
      map((response: any) => {
        const data = response?.status ? response?.data : response;
        return Array.isArray(data) ? data.map(item => this.normalizeRow(item)) : [];
      })
    );
  }

  filterRows(rows: ArApRow[], voucherType: ArApVoucherFilter, status: ArApStatusFilter): ArApRow[] {
    let filtered = [...rows];

    if (voucherType !== 'all') {
      filtered = filtered.filter(item => {
        const documentTypeCode = this.getDocumentTypeCode(item);
        return voucherType === 'REVENUE'
          ? ['INV', 'CRN'].includes(documentTypeCode)
          : ['VIN', 'VINV', 'PMT', 'VCRN', 'VRN'].includes(documentTypeCode);
      });
    }

    if (status !== 'all') {
      filtered = filtered.filter(item => this.getPostStatus(item) === status);
    }

    return filtered;
  }

  calculateTotals(rows: ArApRow[]): ArApTotals {
    return rows.reduce(
      (totals, item) => {
        totals.revenueAmount += this.getRevenueAmount(item) || 0;
        totals.revenueLocalAmount += this.getRevenueLocalAmount(item) || 0;
        totals.costAmount += this.getCostAmount(item) || 0;
        totals.costLocalAmount += this.getCostLocalAmount(item) || 0;
        return totals;
      },
      {
        revenueAmount: 0,
        revenueLocalAmount: 0,
        costAmount: 0,
        costLocalAmount: 0,
        rowCount: rows.length
      }
    );
  }

  getRevenueAmount(item: ArApRow): number | null {
    const sign = this.getRevenueSign(item);
    return sign === 0 ? null : sign * (Number(item?.Amount) || 0);
  }

  getRevenueLocalAmount(item: ArApRow): number | null {
    const sign = this.getRevenueSign(item);
    return sign === 0 ? null : sign * (Number(item?.LocalAmount) || 0);
  }

  getCostAmount(item: ArApRow): number | null {
    const sign = this.getCostSign(item);
    return sign === 0 ? null : sign * (Number(item?.Amount) || 0);
  }

  getCostLocalAmount(item: ArApRow): number | null {
    const sign = this.getCostSign(item);
    return sign === 0 ? null : sign * (Number(item?.LocalAmount) || 0);
  }

  getDocumentTypeCode(item: ArApRow): string {
    return String(item?.DocumentTypeCode || '').trim().toUpperCase();
  }

  getPostStatus(item: ArApRow): string {
    return String(item?.PostStatus || 'U').trim().toUpperCase();
  }

  private normalizeRow(item: any): ArApRow {
    const documentTypeCode = item?.DocumentTypeCode || item?.voucherTypeMaster?.DocumentTypeCode || '';
    return {
      ...item,
      DocumentTypeCode: String(documentTypeCode).toUpperCase(),
      VoucherNumber: item?.VoucherNumber || '',
      VoucherDate: item?.VoucherDate || null,
      VoucherHeaderSid: Number(item?.VoucherHeaderSid) || 0,
      Amount: Number(item?.Amount) || 0,
      CurrencyCode: item?.CurrencyCode || '',
      LocalAmount: Number(item?.LocalAmount) || 0,
      HBLNo: item?.HBLNo || '-',
      HouseJobSid: item?.HouseJobSid || '-',
      MBLNo: item?.MBLNo || item?.MasterNumber || '-',
      PostStatus: item?.PostStatus || 'U'
    };
  }

  private getRevenueSign(item: ArApRow): number {
    const documentTypeCode = this.getDocumentTypeCode(item);
    if (documentTypeCode === 'INV') return 1;
    if (documentTypeCode === 'CRN') return -1;
    return 0;
  }

  private getCostSign(item: ArApRow): number {
    const documentTypeCode = this.getDocumentTypeCode(item);
    if (['VIN', 'VINV', 'PMT'].includes(documentTypeCode)) return 1;
    if (['VCRN', 'VRN'].includes(documentTypeCode)) return -1;
    return 0;
  }
}
