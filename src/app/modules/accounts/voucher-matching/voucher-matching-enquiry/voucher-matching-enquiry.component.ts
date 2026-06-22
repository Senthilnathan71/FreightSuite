import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { VoucherMatchingService } from '../../services/voucher-matching.service';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NgApexchartsModule } from 'ng-apexcharts';
import { getVoucherEntryLink } from 'src/app/common/voucher-route';

@Component({
  selector: 'app-voucher-matching-enquiry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CustomDatePipe, NgApexchartsModule],
  providers: [CustomDatePipe],
  templateUrl: './voucher-matching-enquiry.component.html',
  styles: `
    @media (max-width: 767.98px) {
      .vm-visualize-action-wrap {
        position: fixed;
        right: 14px;
        bottom: 14px;
        z-index: 1050;
        padding: 0 !important;
      }
    }
  `
})
export class VoucherMatchingEnquiryComponent implements OnInit {
  // Voucher-type → entry-route mapping for the Source/Object voucher badges (shared util).
  protected readonly getVoucherEntryLink = getVoucherEntryLink;
  voucherNumber = '';
  isLoading = false;
  errorMessage = '';
  result: any = null;
  showVisualization = false;
  settlementDonutOptions: any = null;
  contributionChartOptions: any = null;
  private readonly emptyVoucherList: any[] = [];

  currentCompany: any;
  currentBranch: any;

  constructor(
    private appSettings: AppSettingsService,
    private vmService: VoucherMatchingService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.currentCompany = this.appSettings.getCurrentCompanyInfo();
    this.currentBranch = this.appSettings.getCurrentBranchInfo();
  }

  search(): void {
    if (!this.voucherNumber?.trim()) {
      this.errorMessage = 'Please enter a voucher number.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.result = null;
    this.showVisualization = false;

    const payload = {
      VoucherNumber: this.voucherNumber.trim(),
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      LocalCurrencyMasterSid: this.currentCompany?.CurrencyMasterSid,
    };

    this.vmService.enquireVoucher(payload).subscribe({
      next: (resp: any) => {
        this.isLoading = false;
        if (resp.status) {
          this.result = resp.data;
          this.buildChartOptions();
        } else {
          this.errorMessage = resp.message || 'Voucher not found.';
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || err?.message || 'Voucher not found.';
      }
    });
  }

  clear(): void {
    this.voucherNumber = '';
    this.result = null;
    this.errorMessage = '';
    this.showVisualization = false;
    this.settlementDonutOptions = null;
    this.contributionChartOptions = null;
  }

  toggleVisualization(): void {
    if (!this.result) return;
    if (!this.settlementDonutOptions) {
      this.buildChartOptions();
    }
    this.showVisualization = !this.showVisualization;
  }

  async copyText(text: string | null | undefined): Promise<void> {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.toastr.success('Copied to clipboard', '', { timeOut: 1500 });
    } catch {
      this.toastr.error('Copy failed');
    }
  }

  navigateToVM(sid: number | null | undefined): void {
    if (!sid) return;
    this.router.navigate(['/accounts/voucher-matching/view', sid]);
  }

  back(): void {
    this.router.navigate(['/accounts/voucher-matching/list']);
  }

  get outstandingIsZero(): boolean {
    return (this.result?.stats?.outstandingLocalAmount ?? 1) === 0;
  }

  get activeMatchings(): any[] {
    return Array.isArray(this.result?.matchings) ? this.result.matchings : [];
  }

  get cancelledMatchings(): any[] {
    return Array.isArray(this.result?.cancelledMatchings) ? this.result.cancelledMatchings : [];
  }

  get insightRows(): any[] {
    return Array.isArray(this.result?.insight) ? this.result.insight : [];
  }

  get sourceMatchingCount(): number {
    const countFromStats = this.result?.stats?.sourceVoucherCount;
    if (countFromStats != null) return Number(countFromStats) || 0;
    return this.activeMatchings.reduce(
      (sum: number, item: any) => sum + Number(item?.sourceVoucherCount ?? (item?.MatchingType === 'Source' ? 1 : 0)),
      0
    );
  }

  get objectMatchingCount(): number {
    const countFromStats = this.result?.stats?.objectVoucherCount;
    if (countFromStats != null) return Number(countFromStats) || 0;
    return this.activeMatchings.reduce(
      (sum: number, item: any) => sum + Number(item?.objectVoucherCount ?? (item?.MatchingType === 'Object' ? 1 : 0)),
      0
    );
  }

  get partyCurrencyCode(): string {
    return this.result?.voucherDetails?.currencyCode || '-';
  }

  get localCurrencyCode(): string {
    const responseCurrencyCode =
      this.result?.voucherDetails?.localCurrencyCode ||
      this.result?.voucherDetails?.LocalCurrencyCode ||
      this.result?.stats?.localCurrencyCode ||
      this.result?.stats?.LocalCurrencyCode;

    if (responseCurrencyCode) return String(responseCurrencyCode).trim();

    const company = this.currentCompany ?? {};
    const currencyCode =
      company.LocalCurrencyCode ||
      company.CurrencyCode ||
      company.currencyCode ||
      company.currency?.currencyCode ||
      company.currencyMaster?.currencyCode ||
      company.CurrencyMaster?.currencyCode ||
      company.Currency?.CurrencyCode ||
      company.Currency?.currencyCode;

    if (currencyCode) return String(currencyCode);
    if (this.partyAndLocalAmountsMatch) return this.partyCurrencyCode;
    return '-';
  }

  get totalMatchedPartyAmount(): number {
    return this.roundAmount(
      this.activeMatchings.reduce((sum: number, item: any) => sum + Number(item?.matchedPartyAmount || 0), 0)
    );
  }

  get outstandingPartyAmount(): number {
    return this.roundAmount(Number(this.result?.voucherDetails?.originalPartyAmount || 0) - this.totalMatchedPartyAmount);
  }

  get exchangeRate(): number {
    const returnedRate =
      this.result?.voucherDetails?.ExchangeRate ??
      this.result?.voucherDetails?.exchangeRate ??
      this.result?.stats?.exchangeRate;

    if (returnedRate != null && !isNaN(Number(returnedRate))) {
      return Number(returnedRate);
    }

    const partyAmount = Math.abs(Number(this.result?.voucherDetails?.originalPartyAmount || 0));
    const localAmount = Math.abs(Number(this.result?.stats?.originalLocalAmount || 0));
    if (!partyAmount) return 1;
    return localAmount / partyAmount;
  }

  get partyExchangeDecimal(): number {
    const decimals =
      this.result?.voucherDetails?.exchangeDecimal ??
      this.result?.voucherDetails?.ExchangeDecimal ??
      this.result?.stats?.exchangeDecimal;

    const parsed = Number(decimals);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 4;
  }

  get singleCurrencySummary(): boolean {
    const partyCode = this.partyCurrencyCode.toUpperCase();
    const localCode = this.localCurrencyCode.toUpperCase();

    if (partyCode && localCode && partyCode === localCode) {
      return true;
    }

    return this.partyAndLocalAmountsMatch && Math.abs(this.exchangeRate - 1) < 0.000001;
  }

  private get partyAndLocalAmountsMatch(): boolean {
    const partyAmount = Number(this.result?.voucherDetails?.originalPartyAmount || 0);
    const localAmount = Number(this.result?.stats?.originalLocalAmount || 0);
    return Math.abs(partyAmount - localAmount) < 0.000001;
  }

  get latestMatching(): any | null {
    if (!this.activeMatchings.length) return null;

    return [...this.activeMatchings].sort((a: any, b: any) => {
      const aTime = a?.VoucherMatchingDate ? new Date(a.VoucherMatchingDate).getTime() : 0;
      const bTime = b?.VoucherMatchingDate ? new Date(b.VoucherMatchingDate).getTime() : 0;
      return bTime - aTime;
    })[0];
  }

  get settlementStatusLabel(): string {
    if (!this.result) return '';
    if (this.outstandingIsZero) return 'Fully Matched';
    if ((this.result?.stats?.totalMatchedLocalAmount ?? 0) > 0) return 'Partially Matched';
    return 'Open';
  }

  get settlementBadgeClass(): string {
    if (this.outstandingIsZero) return 'bg-success';
    if ((this.result?.stats?.totalMatchedLocalAmount ?? 0) > 0) return 'bg-warning text-dark';
    return 'bg-danger';
  }

  get totalMatchedPercent(): number {
    const original = this.result?.stats?.originalLocalAmount ?? 0;
    const matched = this.result?.stats?.totalMatchedLocalAmount ?? 0;
    if (!original) return 0;
    return Math.min(100, Math.round((matched / original) * 100));
  }

  get outstandingPercent(): number {
    if (!this.result?.stats?.originalLocalAmount) return 0;
    return Math.max(0, 100 - this.totalMatchedPercent);
  }

  private buildChartOptions(): void {
    this.settlementDonutOptions = this.buildSettlementDonutOptions();
    this.contributionChartOptions = this.buildContributionChartOptions();
  }

  private buildSettlementDonutOptions(): any {
    const matched = Math.max(0, Number(this.result?.stats?.totalMatchedLocalAmount || 0));
    const outstanding = Math.max(0, Number(this.result?.stats?.outstandingLocalAmount || 0));
    const series = matched || outstanding ? [matched, outstanding] : [1, 0];
    const localCurrencyCode = this.localCurrencyCode;
    const matchedPercent = this.totalMatchedPercent;
    const valueColor = this.outstandingIsZero ? '#0d7a40' : '#1769d4';

    return {
      series,
      chart: {
        type: 'donut',
        height: 170,
        sparkline: { enabled: true },
        animations: { enabled: true, speed: 700 },
      },
      labels: ['Matched', 'Outstanding'],
      colors: ['#15a657', '#e23744'],
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      tooltip: {
        y: {
          formatter: (value: number) => `${this.formatAmount(value)} ${localCurrencyCode}`,
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '68%',
            labels: {
              show: true,
              name: {
                show: true,
                color: '#64748b',
                fontSize: '11px',
                offsetY: 18,
              },
              value: {
                show: true,
                color: valueColor,
                fontSize: '22px',
                fontWeight: 800,
                offsetY: -10,
                formatter: () => `${matchedPercent}%`,
              },
              total: {
                show: true,
                showAlways: true,
                label: 'Matched',
                color: '#64748b',
                formatter: () => `${matchedPercent}%`,
              },
            },
          },
        },
      },
    };
  }

  private buildContributionChartOptions(): any {
    const rows = this.insightRows;
    const localCurrencyCode = this.localCurrencyCode;

    return {
      series: [
        {
          name: 'Contribution',
          data: rows.map((item: any) => Number(item?.matchedLocalAmount || 0)),
        },
      ],
      chart: {
        type: 'bar',
        height: Math.max(120, rows.length * 34),
        toolbar: { show: false },
        sparkline: { enabled: false },
        animations: { enabled: true, speed: 600 },
      },
      colors: ['#1769d4'],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '48%',
          dataLabels: { position: 'top' },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (_value: number, opts: any) => `${rows?.[opts.dataPointIndex]?.contributionPercent || 0}%`,
        offsetX: 18,
        style: {
          fontSize: '11px',
          colors: ['#103a5e'],
        },
      },
      xaxis: {
        categories: rows.map((item: any) => item?.VoucherMatchingNo || '-'),
        labels: {
          formatter: (value: string) => this.formatAmount(Number(value || 0)),
          style: { fontSize: '11px', colors: '#64748b' },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { fontSize: '11px', colors: '#103a5e', fontWeight: 700 },
        },
      },
      grid: {
        borderColor: '#eef1f6',
        strokeDashArray: 3,
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${this.formatAmount(value)} ${localCurrencyCode}`,
        },
      },
      legend: { show: false },
    };
  }

  formatAmount(value: number | null | undefined, decimals: number = 2): string {
    if (value == null || isNaN(Number(value))) return (0).toFixed(decimals);
    return Number(value).toFixed(decimals);
  }

  formatExchangeRate(value: number | null | undefined): string {
    return this.formatAmount(value, this.partyExchangeDecimal);
  }

  getVoucherSummaries(matching: any, type: 'Source' | 'Object'): any[] {
    const key = type === 'Source' ? 'sourceVouchers' : 'objectVouchers';
    return Array.isArray(matching?.[key]) ? matching[key] : this.emptyVoucherList;
  }

  visibleVoucherSummaries(matching: any, type: 'Source' | 'Object'): any[] {
    return this.getVoucherSummaries(matching, type).slice(0, 2);
  }

  hiddenVoucherCount(matching: any, type: 'Source' | 'Object'): number {
    return Math.max(0, this.getVoucherSummaries(matching, type).length - 2);
  }

  voucherSummaryTitle(voucher: any): string {
    const amount = this.formatAmount(voucher?.matchedPartyAmount);
    const localAmount = this.formatAmount(voucher?.matchedLocalAmount);
    return `${voucher?.voucherType || 'Voucher'} | ${amount} ${voucher?.currencyCode || this.partyCurrencyCode} | ${localAmount} ${this.localCurrencyCode}`;
  }

  voucherListTooltip(matching: any, type: 'Source' | 'Object'): string {
    const vouchers = this.getVoucherSummaries(matching, type);
    return vouchers.length
      ? vouchers.map((voucher: any) => `${voucher?.voucherNumber || '-'} (${this.voucherSummaryTitle(voucher)})`).join('\n')
      : '-';
  }

  private roundAmount(value: number, decimals: number = 2): number {
    if (isNaN(Number(value))) return 0;
    return Number(Number(value).toFixed(decimals));
  }

  onEnterKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.search();
  }
}
