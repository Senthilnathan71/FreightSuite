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

  // Returns the earliest voucher date the user should be allowed to pick in
  // the datepicker, based on today's previous-month grace days and the
  // manager's rules. Returns null if there is no grace-based restriction.
  getEarliestAllowedDate(module: VoucherModule): Date | null {
    if (!this.periods || this.periods.length === 0) return null;

    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    // Rule 3: use today's previous calendar month's period for grace
    let prevMonth = todayMonth - 1;
    let prevYear = todayYear;
    if (prevMonth < 0) { prevMonth = 11; prevYear -= 1; }

    let previousPeriod: VoucherPeriodInfo | null = null;
    for (const p of this.periods) {
      const s = new Date(p.StartDate);
      if (s.getUTCMonth() === prevMonth && s.getUTCFullYear() === prevYear) {
        previousPeriod = p;
        break;
      }
    }
    if (!previousPeriod) return null;

    const graceDaysKey = `${module}GraceDays` as keyof VoucherPeriodInfo;
    const graceDays = Number(previousPeriod[graceDaysKey]) || 0;

    // Rule 2: null/0 grace → no restriction
    if (graceDays <= 0) return null;

    // earliestGrace = today − graceDays + 1 (inclusive counting).
    // Datepicker shows exactly `graceDays` selectable dates ending at today.
    return new Date(todayYear, todayMonth, todayDate - graceDays + 1);
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
