import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-pro-rate',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule, NumberFormatPipe, CustomDatePipe],
  providers: [CustomDatePipe],
  templateUrl: './pro-rate.component.html',
})
export class ProRateComponent implements OnInit {
  masterJob: any = null;
  containers: any[] = [];
  totalHouses = 0;
  masterCharges: any[] = [];
  houses: any[] = [];
  expandedHouses = new Set<number>();
  currencyDecimalMap = new Map<number, number>();
  showProratedCharges = false;
  isApplyingProrate = false;

  masterTotals = {
    revenueAmount: 0,
    revenueLocalAmount: 0,
    costAmount: 0,
    costLocalAmount: 0,
  };
  masterSingleRevCurrency = true;
  masterSingleCostCurrency = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private operationService: OperationService,
    private appSettingsService: AppSettingsService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const masterJobSid = +this.route.snapshot.paramMap.get('masterJobSid');
    if (!masterJobSid) {
      this.toastr.error('Invalid Master Job');
      this.goBack();
      return;
    }
    this.loadProRate(masterJobSid);
  }

  loadProRate(masterJobSid: number): void {
    const company = this.appSettingsService.decrypt(
      localStorage.getItem('selected-company'),
    );
    const branch = this.appSettingsService.decrypt(
      localStorage.getItem('selected-branch'),
    );

    this.spinner.show();
    this.operationService
      .calculateProRate({
        CompanyMasterSid: company.CompanyMasterSid,
        BranchMasterSid: branch.BranchMasterSid,
        MasterJobSid: masterJobSid,
      })
      .subscribe({
        next: (resp) => {
          this.spinner.hide();
          if (resp.status) {
            const data = resp.data;
            this.currencyDecimalMap.clear();
            this.masterJob = data.masterJob;
            this.containers = data.containers || [];
            this.totalHouses = data.totalHouses;
            this.masterCharges = data.masterCharges || [];
            this.houses = data.houses || [];
            this.syncProrateVisibility();
            this.expandedHouses.clear();
            if (this.houses.length) this.expandedHouses.add(0);

            if (data.currencies) {
              for (const c of data.currencies) {
                this.currencyDecimalMap.set(
                  c.CurrencyMasterSid,
                  c.amountDecimal,
                );
              }
            }

            this.computeMasterTotals();
            this.computeHouseTotals();

            if (data.warnings?.length) {
              for (const w of data.warnings) {
                this.toastr.warning(w);
              }
            }
          } else {
            this.toastr.error(resp.message || 'Failed to load pro-rate data');
          }
        },
        error: () => {
          this.spinner.hide();
          this.toastr.error('Failed to load pro-rate data');
        },
      });
  }

  applyProrate(): void {
    if (!this.masterJob || this.isApplyingProrate) {
      return;
    }

    const company = this.appSettingsService.decrypt(
      localStorage.getItem('selected-company'),
    );
    const branch = this.appSettingsService.decrypt(
      localStorage.getItem('selected-branch'),
    );

    this.isApplyingProrate = true;
    this.spinner.show();
    this.operationService
      .applyProRate({
        CompanyMasterSid: company.CompanyMasterSid,
        BranchMasterSid: branch.BranchMasterSid,
        MasterJobSid: this.masterJob.MasterJobSid,
      })
      .subscribe({
        next: (resp) => {
          this.spinner.hide();
          this.isApplyingProrate = false;

          if (resp.status) {
            this.masterJob = {
              ...this.masterJob,
              JobtoSubjob: resp.data?.JobtoSubjob || 'Y',
            };
            this.syncProrateVisibility();
            this.computeHouseTotals();
            this.toastr.success('Prorate applied successfully');
            return;
          }

          this.toastr.error(resp.message || 'Failed to apply prorate');
        },
        error: () => {
          this.spinner.hide();
          this.isApplyingProrate = false;
          this.toastr.error('Failed to apply prorate');
        },
      });
  }

  private computeMasterTotals(): void {
    this.masterTotals = {
      revenueAmount: 0,
      revenueLocalAmount: 0,
      costAmount: 0,
      costLocalAmount: 0,
    };
    const revCurrencies = new Set<number>();
    const costCurrencies = new Set<number>();
    for (const c of this.masterCharges) {
      this.masterTotals.revenueAmount += this.toNum(c.RevenueAmount);
      this.masterTotals.revenueLocalAmount += this.toNum(c.RevenueLocalAmount);
      this.masterTotals.costAmount += this.toNum(c.CostAmount);
      this.masterTotals.costLocalAmount += this.toNum(c.CostLocalAmount);
      if (c.RevenueCurrencyMasterSid)
        revCurrencies.add(c.RevenueCurrencyMasterSid);
      if (c.CostCurrencyMasterSid) costCurrencies.add(c.CostCurrencyMasterSid);
    }
    this.masterSingleRevCurrency = revCurrencies.size <= 1;
    this.masterSingleCostCurrency = costCurrencies.size <= 1;
  }

  private computeHouseTotals(): void {
    for (const house of this.houses) {
      const totals = {
        revenueAmount: 0,
        revenueLocalAmount: 0,
        costAmount: 0,
        costLocalAmount: 0,
      };
      const revCurrencies = new Set<number>();
      const costCurrencies = new Set<number>();
      for (const c of house.existingCharges || []) {
        totals.revenueAmount += this.toNum(c.RevenueAmount);
        totals.revenueLocalAmount += this.toNum(c.RevenueLocalAmount);
        totals.costAmount += this.toNum(c.CostAmount);
        totals.costLocalAmount += this.toNum(c.CostLocalAmount);
        if (c.RevenueCurrencyMasterSid)
          revCurrencies.add(c.RevenueCurrencyMasterSid);
        if (c.CostCurrencyMasterSid)
          costCurrencies.add(c.CostCurrencyMasterSid);
      }
      if (this.showProratedCharges) {
        for (const c of house.proratedCharges || []) {
          totals.revenueAmount += this.toNum(c.revenueAmount);
          totals.revenueLocalAmount += this.toNum(c.revenueLocalAmount);
          totals.costAmount += this.toNum(c.costAmount);
          totals.costLocalAmount += this.toNum(c.costLocalAmount);
          if (c.revenueCurrencyMasterSid)
            revCurrencies.add(c.revenueCurrencyMasterSid);
          if (c.costCurrencyMasterSid)
            costCurrencies.add(c.costCurrencyMasterSid);
        }
      }
      house._totals = totals;
      house._singleRevCurrency = revCurrencies.size <= 1;
      house._singleCostCurrency = costCurrencies.size <= 1;
    }
  }

  private toNum(val: any): number {
    if (val == null) return 0;
    const n = typeof val === 'string' ? parseFloat(val) : +val;
    return isNaN(n) ? 0 : n;
  }

  getDecimals(currencyMasterSid: number): number {
    if (!currencyMasterSid) return 2;
    return this.currencyDecimalMap.get(currencyMasterSid) ?? 2;
  }

  hasVisibleCharges(house: any): boolean {
    return this.getVisibleChargeCount(house) > 0;
  }

  getVisibleChargeCount(house: any): number {
    return (
      (house?.existingCharges?.length || 0) +
      (this.showProratedCharges ? house?.proratedCharges?.length || 0 : 0)
    );
  }

  canShowProrateButton(): boolean {
    return this.masterJob?.JobtoSubjob !== 'Y';
  }

  canApplyProrate(): boolean {
    return (
      !this.isApplyingProrate &&
      this.totalHouses > 0 &&
      this.masterCharges.length > 0
    );
  }

  goBack(): void {
    this.router.navigate(['operation/master-job/list']);
  }

  toggleHouse(index: number): void {
    if (this.expandedHouses.has(index)) {
      this.expandedHouses.delete(index);
    } else {
      this.expandedHouses.add(index);
    }
  }

  isHouseExpanded(index: number): boolean {
    return this.expandedHouses.has(index);
  }

  getProfit(): number {
    return this.masterTotals.revenueAmount - this.masterTotals.costAmount;
  }

  getProfitLocal(): number {
    return (
      this.masterTotals.revenueLocalAmount - this.masterTotals.costLocalAmount
    );
  }

  private syncProrateVisibility(): void {
    this.showProratedCharges = this.masterJob?.JobtoSubjob === 'Y';
  }

  getTotalContainerCount(cargo: any): number {
    if (!cargo) return 0;
    const counts = cargo.containerTypeCounts || {};
    return (counts['20ft'] || 0) + (counts['40ft'] || 0) + (counts['45ft'] || 0);
  }

  getContainerTooltip(cargo: any): string {
    if (!cargo || !cargo.containerNumbers || cargo.containerNumbers.length === 0) {
      return 'No containers';
    }
    const counts = cargo.containerTypeCounts || {};
    const parts: string[] = [];
    if (counts['20ft']) parts.push(`${counts['20ft']} x 20ft`);
    if (counts['40ft']) parts.push(`${counts['40ft']} x 40ft`);
    if (counts['45ft']) parts.push(`${counts['45ft']} x 45ft`);
    const containers = cargo.containerNumbers.join(', ');
    return `${parts.join(', ')}\nContainers: ${containers}`;
  }
}
