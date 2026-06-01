import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { AccountsService } from '../accounts.service';

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
      TaxableAmount: [{ value: 0, disabled: true }],
      TDSRate: [0],
      TDSAmount: [{ value: 0, disabled: true }],
      TDSPartyAmount: [{ value: 0, disabled: true }],
      Reason: [''],
    });
  }

  loadTDSSets(CompanyMasterSid: number): Observable<void> {
    return this.accountsService.getAllTDSSet(CompanyMasterSid).pipe(
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

    const isExempt = mapping.TaxExempt === 'Y';
    tdsForm.patchValue(
      {
        TDSSetHeaderSid: mapping.TDSSetHeaderSid,
        TDSSetRateSid: applicable?.TDSSetRateSid ?? null,
        CompanyType: this.customerCompanyType ?? mapping.CompanyType ?? applicable?.CompanyType ?? '',
        ITSectionCode: isExempt ? (mapping.ITSecCode ?? '') : (applicable?.ITSectionCode ?? ''),
        CertificateNo: mapping.CertificateNo ?? '',
        CertificateAmt: mapping.CertificateAmt ?? '',
        TDSRate: isExempt ? Number(mapping.CertificatePercentage ?? 0) : Number(applicable?.TDSRate ?? 0),
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
   * Stores FULL taxable amount in TaxableAmount (for cumulative tracking).
   * TDSAmount may be calculated on the excess only when the annual limit is crossed
   * mid-payment — Reason is auto-filled to explain this.
   */
  recalcTDSAmounts(
    detailRows: any[],
    tdsForm: FormGroup,
    headerExchangeRate: number,
  ): void {
    // LocalAmount is the pre-tax base in this app (tax amounts live on separate fields).
    const fullTaxableAmount = (detailRows || [])
      .filter((r) => r?.IsAutoGenerated !== 'Y')
      .reduce((sum, r) => sum + (Number(r?.LocalAmount) || 0), 0);

    // Transaction limit
    const mappingTxnLimit = Number(this.supplierTdsMapping?.TransactionLimit ?? 0);
    const setTxnLimit = Number(this.supplierTdsMapping?.tdsSetHeader?.TransactionLimit ?? 0);
    const txnLimit = mappingTxnLimit > 0 ? mappingTxnLimit : setTxnLimit;

    if (txnLimit > 0 && fullTaxableAmount < txnLimit) {
      this.limitNote = `Below per-transaction threshold of ₹${this.fmt(txnLimit)}`;
      this.autoReason = `Taxable amount ₹${this.fmt(fullTaxableAmount)} is below per-transaction threshold ₹${this.fmt(txnLimit)}`;
      this.applyAmounts(tdsForm, fullTaxableAmount, 0, headerExchangeRate);
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
        this.applyAmounts(tdsForm, fullTaxableAmount, 0, headerExchangeRate);
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
    this.applyAmounts(tdsForm, fullTaxableAmount, tdsAmt, headerExchangeRate);
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
    this.isTDSEnabled = false;
    this.limitNote = null;
    this.autoReason = null;
    this.allRatesForSet = [];
    this.tdsRateList = [];
  }

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
  ): void {
    const partyAmt = exRate > 0 ? tdsAmt / exRate : tdsAmt;
    form.patchValue(
      {
        TaxableAmount: taxable,
        TDSAmount: tdsAmt,
        TDSPartyAmount: partyAmt,
      },
      { emitEvent: false },
    );
  }

  private fmt(n: number): string {
    return Number(n || 0).toLocaleString('en-IN');
  }
}
