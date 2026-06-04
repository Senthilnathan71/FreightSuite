import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AccountsService } from '../accounts.service';

export interface ApplicableRateParams {
  isLocal: boolean;
  isSpecified: boolean;
  hasPAN: boolean;
  isExempt: boolean;
  certPct: number;
  baseRate: number | null;
}

/**
 * Reusable TDS helper for voucher screens (payment, receipt, JV).
 *
 * Responsibilities:
 *  - Build & manage the TDS FormGroup
 *  - Fetch SupplierTdsMapping + Customer's CompanyType + FY cumulative
 *  - Filter applicable TDSSetRate rows by the Customer's CompanyType
 *  - Apply transaction + annual limit logic with excess-only calculation
 *  - Provide form payload for save/update
 */
@Injectable()
export class TdsHelperService {
  tdsSetList: any[] = [];
  tdsRateList: any[] = [];                 // already filtered by customerCompanyType
  private allRatesForSet: any[] = [];      // raw, unfiltered (for re-filter when type changes)
  supplierTdsMapping: any | null = null;
  customerCompanyType: string | null = null;
  cumulativeTaxableAmount = 0;             // FY cumulative for this vendor
  certificateCumulativeDeducted = 0;       // SM-9: FY-to-date TDS withheld for this vendor
  certificateExhausted = false;            // SM-9: certificate amount cap reached
  isTDSEnabled = false;
  limitNote: string | null = null;
  autoReason: string | null = null;

  constructor(private accountsService: AccountsService) {}

  buildTdsForm(fb: FormBuilder): FormGroup {
    return fb.group({
      TDSSetHeaderSid: [null],
      TDSSetRateSid: [null],
      CompanyType: [''],
      ITSectionCode: [''],
      CertificateNo: [''],
      CertificateAmt: [''],
      TaxableAmount: [0],
      TDSRate: [0],
      TDSAmount: [0],
      TDSPartyAmount: [0],
      Reason: [''],
    });
  }

  loadTDSSets(_CompanyMasterSid?: number): Observable<void> {
    // TDS Set Header is a global master — no CompanyMasterSid filter.
    return this.accountsService.getAllTDSSet().pipe(
      tap((res: any) => {
        this.tdsSetList = res?.data || [];
      }),
      map(() => void 0),
      catchError(() => of(void 0)),
    );
  }

  fetchAndPopulate(args: {
    CustomerBranchSid: number;
    LedgerMasterSid: number;
    CompanyMasterSid: number;
    fyStartDate: Date;
    fyEndDate: Date;
    voucherDate: Date;
    excludeVoucherHeaderSid?: number;
    tdsForm: FormGroup;
  }): Observable<void> {
    return this.accountsService
      .getSupplierTdsByBranch({
        CustomerBranchSid: args.CustomerBranchSid,
        LedgerMasterSid: args.LedgerMasterSid,
        CompanyMasterSid: args.CompanyMasterSid,
        fyStartDate: args.fyStartDate.toISOString(),
        fyEndDate: args.fyEndDate.toISOString(),
        voucherDate: args.voucherDate.toISOString(),
        excludeVoucherHeaderSid: args.excludeVoucherHeaderSid,
      })
      .pipe(
        tap((res: any) => {
          const data = res?.data ?? {};
          this.supplierTdsMapping = data.mapping ?? null;
          this.customerCompanyType = data.customerCompanyType ?? null;
          this.cumulativeTaxableAmount = Number(data.cumulativeTaxableAmount ?? 0);
          this.certificateCumulativeDeducted = Number(data.certificateCumulativeDeducted ?? 0);
          this.certificateExhausted = !!data.certificateExhausted;
          if (this.supplierTdsMapping) {
            this.isTDSEnabled = true;
            this.populateFromMapping(this.supplierTdsMapping, args.voucherDate, args.tdsForm);
          } else {
            this.allRatesForSet = [];
            this.tdsRateList = [];
            args.tdsForm.reset({
              TaxableAmount: 0,
              TDSAmount: 0,
              TDSPartyAmount: 0,
              TDSRate: 0,
            });
          }
        }),
        map(() => void 0),
        catchError(() => of(void 0)),
      );
  }

  populateFromMapping(mapping: any, voucherDate: Date, tdsForm: FormGroup): void {
    const rates: any[] = this.decorateRates(mapping.tdsSetHeader?.tdsSetRate || []);
    this.allRatesForSet = rates;
    this.tdsRateList = this.filterRatesByCompanyType(rates);

    const date = new Date(voucherDate);
    const applicable = this.tdsRateList
      .filter((r) => new Date(r.EffectiveFrom) <= date)
      .sort(
        (a, b) =>
          new Date(b.EffectiveFrom).getTime() - new Date(a.EffectiveFrom).getTime(),
      )[0];

    // SM-9: certificate cap reached → revert to master rate, surface reason.
    const isExempt = mapping.TaxExempt === 'Y' && !this.certificateExhausted;
    const masterRate = Number(applicable?.TDSRate ?? 0);

    let reason = '';
    if (mapping.TaxExempt === 'Y' && this.certificateExhausted) {
      reason = `Lower-deduction certificate cap of ₹${mapping.CertificateAmt} reached (cumulative TDS deducted so far this FY: ₹${this.certificateCumulativeDeducted}). Reverting to master rate ${masterRate}%.`;
      this.limitNote = reason;
      this.autoReason = reason;
    }

    tdsForm.patchValue(
      {
        TDSSetHeaderSid: mapping.TDSSetHeaderSid,
        TDSSetRateSid: applicable?.TDSSetRateSid ?? null,
        CompanyType: this.customerCompanyType ?? mapping.CompanyType ?? applicable?.CompanyType ?? '',
        ITSectionCode: isExempt ? (mapping.ITSecCode ?? '') : (applicable?.ITSectionCode ?? ''),
        CertificateNo: mapping.CertificateNo ?? '',
        CertificateAmt: mapping.CertificateAmt ?? '',
        TDSRate: isExempt ? Number(mapping.CertificatePercentage ?? 0) : masterRate,
        ...(reason ? { Reason: reason } : {}),
      },
      { emitEvent: false },
    );
  }

  loadRatesForSet(TDSSetHeaderSid: number): Observable<void> {
    return this.accountsService.getTDSDetailByHeader(TDSSetHeaderSid).pipe(
      tap((res: any) => {
        const rates = this.decorateRates(res?.data || []);
        this.allRatesForSet = rates;
        this.tdsRateList = this.filterRatesByCompanyType(rates);
      }),
      map(() => void 0),
      catchError(() => of(void 0)),
    );
  }

  /**
   * Adds a `displayLabel` field to each rate so ng-select can use `bindLabel`
   * (avoids the ng-template + appendTo="body" rendering issue).
   */
  private decorateRates(rates: any[]): any[] {
    return (rates || []).map((r) => ({
      ...r,
      displayLabel: `${r?.CompanyType ?? ''} — ${Number(r?.TDSRate ?? 0)}%`,
    }));
  }

  /**
   * Compute the TDS taxable base from detail rows.
   *
   * Preference:
   *   1. Sum TaxableAmount of rows tied to a job (MasterJobSid or HouseJobSid).
   *   2. Fall back to the party row's TaxableAmount (LedgerMasterSid = vendor).
   *
   * Stores FULL taxable amount in TaxableAmount (for cumulative tracking).
   * TDSAmount may be calculated on the excess only when the annual limit is crossed
   * mid-payment — Reason is auto-filled to explain this.
   */
  recalcTDSAmounts(
    detailRows: any[],
    tdsForm: FormGroup,
    headerExchangeRate: number,
    partyLedgerMasterSid?: number | null,
    formatAmount?: (n: number) => number | string,
  ): void {
    const fmtAmt: (n: number) => number | string = formatAmount ?? ((n: number) => n);
    const nonAutoRows = (detailRows || []).filter((r) => r?.IsAutoGenerated !== 'Y');

    // 1. Prefer job-attributed rows
    const jobRows = nonAutoRows.filter((r) => r?.MasterJobSid || r?.HouseJobSid);
    let fullTaxableAmount = jobRows.reduce(
      (sum, r) => sum + (Number(r?.TaxableAmount) || 0),
      0,
    );

    // 2. Fallback to party row when no job rows are present
    if (fullTaxableAmount === 0 && partyLedgerMasterSid) {
      const partyRow = nonAutoRows.find(
        (r) => Number(r?.LedgerMasterSid) === Number(partyLedgerMasterSid),
      );
      fullTaxableAmount = Number(partyRow?.TaxableAmount) || 0;
    }

    // Transaction limit
    const mappingTxnLimit = Number(this.supplierTdsMapping?.TransactionLimit ?? 0);
    const setTxnLimit = Number(this.supplierTdsMapping?.tdsSetHeader?.TransactionLimit ?? 0);
    const txnLimit = mappingTxnLimit > 0 ? mappingTxnLimit : setTxnLimit;

    if (txnLimit > 0 && fullTaxableAmount < txnLimit) {
      this.limitNote = `Below per-transaction threshold of ₹${this.fmt(txnLimit)}`;
      this.autoReason = `Taxable amount ₹${this.fmt(fullTaxableAmount)} is below per-transaction threshold ₹${this.fmt(txnLimit)}`;
      this.applyAmounts(tdsForm, fullTaxableAmount, 0, headerExchangeRate, fmtAmt);
      tdsForm.patchValue({ Reason: this.autoReason }, { emitEvent: false });
      return;
    }

    // Annual limit
    const annualLimit = Number(this.supplierTdsMapping?.tdsSetHeader?.AnnualLimit ?? 0);
    const cumulative = this.cumulativeTaxableAmount;
    let tdsBase = fullTaxableAmount;

    if (annualLimit > 0) {
      const projected = cumulative + fullTaxableAmount;
      if (projected < annualLimit) {
        this.limitNote = `Cumulative ₹${this.fmt(projected)} is below annual limit ₹${this.fmt(annualLimit)}`;
        this.autoReason = this.limitNote;
        this.applyAmounts(tdsForm, fullTaxableAmount, 0, headerExchangeRate, fmtAmt);
        tdsForm.patchValue({ Reason: this.autoReason }, { emitEvent: false });
        return;
      }
      if (cumulative < annualLimit) {
        tdsBase = projected - annualLimit;
        this.limitNote = `Annual limit crossed this payment. TDS on excess: ₹${this.fmt(tdsBase)}`;
        this.autoReason = this.limitNote;
      } else {
        this.limitNote = null;
        this.autoReason = null;
      }
    } else {
      this.limitNote = null;
      this.autoReason = null;
    }

    const rate = Number(tdsForm.get('TDSRate')?.value || 0);
    const tdsAmt = (tdsBase * rate) / 100;
    this.applyAmounts(tdsForm, fullTaxableAmount, tdsAmt, headerExchangeRate, fmtAmt);
    if (this.autoReason) {
      tdsForm.patchValue({ Reason: this.autoReason }, { emitEvent: false });
    }
  }

  patchFromSavedTDS(vtds: any, tdsForm: FormGroup): void {
    const rateInfo = vtds.TDSSetRate || vtds.tdsSetRate || {};
    tdsForm.patchValue(
      {
        TDSSetHeaderSid: rateInfo.TDSSetHeaderSid ?? null,
        TDSSetRateSid: vtds.TDSSetRateSid,
        CompanyType: rateInfo.CompanyType ?? this.customerCompanyType ?? '',
        ITSectionCode: vtds.ITSectionCode,
        TDSRate: Number(vtds.TDSRate ?? 0),
        TaxableAmount: Number(vtds.TaxableAmount ?? 0),
        TDSAmount: Number(vtds.TDSAmount ?? 0),
        TDSPartyAmount: Number(vtds.TDSPartyAmount ?? 0),
        Reason: vtds.Reason ?? '',
      },
      { emitEvent: false },
    );
  }

  buildPayload(tdsForm: FormGroup): any | null {
    if (!this.isTDSEnabled) return null;
    const v = tdsForm.getRawValue();
    if (!v.TDSAmount || Number(v.TDSAmount) <= 0) return null;
    return { ...v };
  }

  reset(): void {
    this.supplierTdsMapping = null;
    this.customerCompanyType = null;
    this.cumulativeTaxableAmount = 0;
    this.certificateCumulativeDeducted = 0;
    this.certificateExhausted = false;
    this.isTDSEnabled = false;
    this.limitNote = null;
    this.autoReason = null;
    this.allRatesForSet = [];
    this.tdsRateList = [];
  }

  // ─── TDS Matrix ───────────────────────────────────────────────────────────

  /**
   * Pure TDS matrix computation — mirrors TdsCalculationService.computeApplicableRate
   * on the backend. Returns the numeric rate, or null when a required input is absent.
   *
   * Future rule changes (Transporter / Vessel Operator exemption, Sec 206AB) should be
   * applied here AND in the backend service simultaneously so all UIs stay consistent.
   */
  computeApplicableRate(params: ApplicableRateParams): number | null {
    const { isLocal, isSpecified, hasPAN, isExempt, certPct, baseRate } = params;

    if (!isLocal) {
      if (isExempt) return certPct > 0 ? this.capRate(certPct) : null;
      return baseRate;
    }

    if (isSpecified) {
      if (hasPAN) {
        if (isExempt) return certPct > 0 ? Math.max(5, this.capRate(certPct * 2)) : null;
        return baseRate != null ? Math.max(5, this.capRate(baseRate * 2)) : null;
      }
      if (isExempt) return certPct > 0 ? Math.max(this.capRate(certPct * 2), 20) : null;
      return baseRate != null ? Math.max(this.capRate(baseRate * 2), 20) : null;
    }

    // Non-Specified
    if (hasPAN) {
      if (isExempt) return certPct > 0 ? this.capRate(certPct) : null;
      return baseRate;
    }
    if (isExempt) return certPct > 0 ? Math.max(this.capRate(certPct), 20) : null;
    return baseRate != null ? Math.max(baseRate, 20) : 20;
  }

  capRate(rate: number): number {
    return Math.round(Math.min(Math.max(rate, 0), 100) * 100) / 100;
  }

  /**
   * Picks the best-matching base rate from a cached TDSSetRate array.
   * Filters by CompanyType, then CountryMasterSid, then EffectiveFrom <= today.
   */
  lookupBaseRate(
    rates: any[],
    customerCompanyType: string | null,
    customerCountrySid: number | null,
  ): number | null {
    if (!rates.length) return null;

    const target = (customerCompanyType || '').trim().toLowerCase();
    let candidates = target
      ? rates.filter(r => (r?.CompanyType ?? '').toString().trim().toLowerCase() === target)
      : rates.slice();
    if (!candidates.length) candidates = rates.slice();

    if (customerCountrySid) {
      const byCountry = candidates.filter(
        r => r?.CountryMasterSid == null || Number(r.CountryMasterSid) === Number(customerCountrySid),
      );
      if (byCountry.length) candidates = byCountry;
    }

    const today = new Date();
    const effective = candidates.filter(r => {
      if (r?.status && r.status !== 'A') return false;
      if (!r?.EffectiveFrom) return true;
      return new Date(r.EffectiveFrom) <= today;
    });
    if (!effective.length) return null;

    effective.sort(
      (a, b) => new Date(b.EffectiveFrom ?? 0).getTime() - new Date(a.EffectiveFrom ?? 0).getTime(),
    );
    const rate = Number(effective[0]?.TDSRate);
    return Number.isFinite(rate) ? rate : null;
  }

  // ──────────────────────────────────────────────────────────────────────────

  private filterRatesByCompanyType(rates: any[]): any[] {
    if (!this.customerCompanyType) return rates;
    const target = String(this.customerCompanyType).trim().toLowerCase();
    const matching = rates.filter(
      (r) => String(r?.CompanyType ?? '').trim().toLowerCase() === target,
    );
    // Fallback to all rates if no rate matches the customer's company type
    return matching.length > 0 ? matching : rates;
  }

  private applyAmounts(
    form: FormGroup,
    taxable: number,
    tdsAmt: number,
    exRate: number,
    fmtAmt: (n: number) => number | string = (n) => n,
  ): void {
    const partyAmt = exRate > 0 ? tdsAmt / exRate : tdsAmt;
    // Emit events so the DecimalPrecision directive's valueChanges subscription fires
    // and reformats the input to the currency's decimal precision.
    form.patchValue({
      TaxableAmount: fmtAmt(taxable),
      TDSAmount: fmtAmt(tdsAmt),
      TDSPartyAmount: fmtAmt(partyAmt),
    });
  }

  private fmt(n: number): string {
    return Number(n || 0).toLocaleString('en-IN');
  }
}
