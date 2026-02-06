import { Injectable } from '@angular/core';
import { NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { MasterService } from '../modules/master/master.service';
import { VoucherPeriodInfo, VoucherModule, getVoucherDateConstraints } from './helper';

export interface VoucherDateConstraints {
  minDate: NgbDateStruct | null;
  maxDate: NgbDateStruct | null;
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
    this.masterService.getAllVoucherPeriods(companyId, branchId, yearId).subscribe({
      next: (periods: VoucherPeriodInfo[]) => {
        this.periods = periods || [];
        if (callback) callback();
      },
      error: (err: any) => {
        console.error('Error loading voucher periods:', err);
      }
    });
  }

  applyConstraints(voucherDate: any, module: VoucherModule): VoucherDateConstraints {
    const result: VoucherDateConstraints = {
      minDate: null, maxDate: null, isClosed: false, errorMessage: null
    };
    if (!voucherDate || this.periods.length === 0) return result;
    const dateObj = new Date(voucherDate);
    return getVoucherDateConstraints(dateObj, this.periods, module);
  }
}
