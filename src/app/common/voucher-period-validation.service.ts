import { Injectable } from '@angular/core';
import { MasterService } from '../modules/master/master.service';
import { VoucherPeriodInfo, VoucherModule, getVoucherDateConstraints, ngbDateStructToDate } from './helper';

export interface VoucherDateConstraints {
  isClosed: boolean;
  errorMessage: string | null;
}

@Injectable({ providedIn: 'root' })
export class VoucherPeriodValidationService {
  periods: VoucherPeriodInfo[] = [];

  constructor(private masterService: MasterService) {}

  loadPeriods(
    companyId: number,
    branchId: number,
    yearId: number,
    callback?: () => void
  ): void {
    if (!companyId || !branchId || !yearId) return;
    const payload = {
      search: '',
      page: 1,
      pageSize: 50,
      activeCompanyId: companyId,
      activeBranchId: branchId,
      yearMasterSid: yearId,
      sortColumn: 'PeriodName',
      sortDirection: 'asc'
    };
    this.masterService.searchVoucherPeriodList(payload).subscribe({
      next: (resp: any) => {
        this.periods = resp?.data?.items || resp?.data || [];
        if (callback) callback();
      },
      error: (err: any) => {
        console.error('Error loading voucher periods:', err);
      }
    });
  }

  applyConstraints(voucherDate: any, module: VoucherModule): VoucherDateConstraints {
    const result: VoucherDateConstraints = {
      isClosed: false, errorMessage: null
    };
    if (!voucherDate || this.periods.length === 0) return result;

    // Handle NgbDateStruct {year, month, day}, Date, or string
    let dateObj: Date;
    if (voucherDate instanceof Date) {
      dateObj = voucherDate;
    } else if (typeof voucherDate === 'object' && 'year' in voucherDate && 'month' in voucherDate && 'day' in voucherDate) {
      dateObj = ngbDateStructToDate(voucherDate)!;
    } else {
      dateObj = new Date(voucherDate);
    }

    if (isNaN(dateObj.getTime())) return result;

    return getVoucherDateConstraints(dateObj, this.periods, module);
  }
}
