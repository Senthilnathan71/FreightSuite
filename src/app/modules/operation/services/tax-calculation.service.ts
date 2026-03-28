import { Injectable } from '@angular/core';
import { MasterService } from 'src/app/modules/master/master.service';
import { firstValueFrom } from 'rxjs';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TaxRegime = 'GST' | 'VAT' | 'NONE';
export type TradeFlow = 'DOMESTIC' | 'EXPORT' | 'IMPORT';
export type DocumentSide = 'SALES' | 'PURCHASE';
export type AppliedTaxMode = 'CGST_SGST' | 'CGST_UGST' | 'IGST' | 'VAT' | 'NONE';
export type DocumentClass = 'B2B' | 'B2C' | 'EXPWP' | 'EXPWOP' | 'RCM' | 'VAT';
export type InvoiceType = 'REG' | 'REIMB' | 'NONGST' | 'BOS' | 'RCM' | 'EXE' | 'OOS';
export type TaxCategory = 'Inter' | 'Intra';
export type InputOrOutput = 'Input' | 'Output';

// ── Interfaces ─────────────────────────────────────────────────────────────────

export interface PartyTaxProfile {
  countryCode: string;
  stateName: string;
  stateMasterSid?: number;
  gstNumber?: string;
  customerGstType?: string;
  isUnionTerritory?: boolean;
  selectedGstType?: 'B2B' | 'B2C' | 'EXPWP' | 'EXPWOP' | 'RCM' | 'VAT' | '';
}

export interface CompanyTaxProfile {
  countryCode: string;
  countryMasterSid: number;
  stateName: string;
  stateMasterSid?: number;
  taxRegime: TaxRegime;
}

export interface TaxContext {
  company: CompanyTaxProfile;
  party: PartyTaxProfile;
  documentSide: DocumentSide;
  inputOrOutput: InputOrOutput;
  invoiceType: InvoiceType;
  documentClass: DocumentClass;
  appliedTaxMode: AppliedTaxMode;
  taxCategory: TaxCategory;
  tradeFlow: TradeFlow;
  isRCM: boolean;
}

export interface TaxClassification {
  documentClass: DocumentClass;
  appliedTaxMode: AppliedTaxMode;
  taxCategory: TaxCategory;
  tradeFlow: TradeFlow;
  formGSTType: string;
  isRCM: boolean;
}

export interface RowTaxInput {
  taxableAmount: number;
  taxGroupSid: number;
}

export interface RowTaxResult {
  TaxPercentage1: number;
  TaxAmount1: number;
  TaxPercentage2: number;
  TaxAmount2: number;
  TotalTaxAmount: number;
  TaxLabel: string;
}

export interface VoucherTaxTotals {
  totalTaxAmount1: number;
  totalTaxAmount2: number;
  totalTaxAmount: number;
  totalLocalAmount: number;
  totalAmountWithTax: number;
}

// Backward-compatible legacy shape still referenced by invoice-new.
export interface TaxCalculationResult {
  type: 'GST' | 'VAT' | 'NONE';
  lineItems: any[];
}

// ── Retained interfaces from old service ───────────────────────────────────────

export interface BillingPartyDetails {
  CustomerMasterSid: number;
  CustomerName: string;
  CustomerAddress1: string;
  CountryName: string;
  StateName: string;
  GSTNumber?: string;
  TINNumber?: string;
  Email?: string;
}

export interface BookingRateDetails {
  RateSid: number;
  ChargeMasterSid: number;
  ChargeDescription: string;
  RevenueCurrencyMasterSid: number;
  RevenueExchangeRate: number;
  RevenueAmount: number;
  RevenueLocalAmount: number;
  CostCurrencyMasterSid?: number;
  CostExchangeRate?: number;
  CostAmount?: number;
  CostLocalAmount?: number;
  CustomerMasterSid: number;
  CustomerBranchSid: number;
  VoucherHeaderSid?: number;
  ChargeMaster?: {
    chargeName: string;
    HSNSAC?: string;
    chargeTaxMaster?: Array<{
      ChargeTaxMasterSid: number;
      hssacMaster: {
        HSSACMasterSid: number;
        HSSACCode: string;
        TaxRate: number;
        TaxType: string;
        TaxGroupSid: number;
      };
    }>;
  };
  customerMaster?: BillingPartyDetails;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class TaxCalculationService {
  private _context: TaxContext | null = null;
  private workingTaxMasters: any[] = [];

  constructor(private masterService: MasterService) {}

  // ── Getters ────────────────────────────────────────────────────────────────

  get context(): TaxContext | null {
    return this._context;
  }

  get isIndiaGST(): boolean {
    return this._context?.company.taxRegime === 'GST';
  }

  get isVATMode(): boolean {
    return this._context?.company.taxRegime === 'VAT';
  }

  get isExportOrSEZ(): boolean {
    return this._context?.tradeFlow === 'EXPORT' || this._context?.tradeFlow === 'IMPORT'
      || this._context?.party?.customerGstType === 'SEZ';
  }

  get isSEZ(): boolean {
    return this._context?.party?.customerGstType === 'SEZ';
  }

  get isOversea(): boolean {
    return this._context?.tradeFlow === 'EXPORT' || this._context?.tradeFlow === 'IMPORT';
  }

  // ── init() — Sets up company context (no API call) ────────────────────────

  async init(params: {
    documentSide: DocumentSide;
    companyCountryCode: string;
    companyCountryMasterSid: number;
    branchStateName: string;
    branchStateMasterSid?: number;
  }): Promise<void> {
    const countryCode = (params.companyCountryCode || '').trim().toLowerCase();
    const taxRegime: TaxRegime = countryCode === 'in' ? 'GST' : 'VAT';
    const inputOrOutput: InputOrOutput =
      params.documentSide === 'SALES' ? 'Output' : 'Input';

    this._context = {
      company: {
        countryCode,
        countryMasterSid: params.companyCountryMasterSid,
        stateName: params.branchStateName || '',
        stateMasterSid: params.branchStateMasterSid,
        taxRegime,
      },
      party: { countryCode: '', stateName: '' },
      documentSide: params.documentSide,
      inputOrOutput,
      invoiceType: 'REG',
      documentClass: 'B2B',
      appliedTaxMode: taxRegime === 'GST' ? 'IGST' : 'VAT',
      taxCategory: 'Inter',
      tradeFlow: 'DOMESTIC',
      isRCM: false,
    };
  }

  // ── fetchTaxMasters() — Filtered API call ────────────────────────────────

  async fetchTaxMasters(documentSide: DocumentSide): Promise<void> {
    if (!this._context) return;

    const inputOrOutput: InputOrOutput =
      documentSide === 'SALES' ? 'Output' : 'Input';
    this._context.documentSide = documentSide;
    this._context.inputOrOutput = inputOrOutput;

    try {
      const taxRecords = await firstValueFrom(
        this.masterService.getTaxByCountryAndType(
          this._context.company.countryMasterSid,
          inputOrOutput
        )
      );
      this.workingTaxMasters = taxRecords || [];
    } catch (err) {
      console.error('TaxCalculationService: Failed to fetch TaxMasters', err);
      this.workingTaxMasters = [];
    }
  }

  // ── Re-init for document side change (Cost Entry) ─────────────────────────

  async reinitForDocumentSide(documentSide: DocumentSide): Promise<void> {
    if (!this._context) return;
    await this.fetchTaxMasters(documentSide);
  }

  // ── updateParty() ─────────────────────────────────────────────────────────

  updateParty(
    party: PartyTaxProfile,
    invoiceType?: InvoiceType
  ): TaxClassification {
    if (!this._context) {
      return this.emptyClassification();
    }
    this._context.party = party;
    if (invoiceType !== undefined) {
      this._context.invoiceType = invoiceType;
    }
    return this.deriveClassification();
  }

  // ── updateInvoiceType() ───────────────────────────────────────────────────

  updateInvoiceType(invoiceType: InvoiceType): TaxClassification {
    if (!this._context) {
      return this.emptyClassification();
    }
    this._context.invoiceType = invoiceType;
    return this.deriveClassification();
  }

  updateSelectedGstType(selectedGstType: 'EXPWP' | 'EXPWOP'): TaxClassification {
    if (!this._context?.party) return this.emptyClassification();
    this._context.party = { ...this._context.party, selectedGstType };
    return this.deriveClassification();
  }

  findZeroRatedHSSAC(hssacList: any[]): any | null {
    return hssacList?.find(h => parseFloat(h.TaxRate) === 0) ?? null;
  }

  // ── calculateRowTax() — SYNCHRONOUS ───────────────────────────────────────

  calculateRowTax(input: RowTaxInput): RowTaxResult {
    const zero: RowTaxResult = {
      TaxPercentage1: 0,
      TaxAmount1: 0,
      TaxPercentage2: 0,
      TaxAmount2: 0,
      TotalTaxAmount: 0,
      TaxLabel: '',
    };

    if (!this._context) return zero;
    if (this._context.appliedTaxMode === 'NONE') return zero;
    if (!input.taxGroupSid) return zero;

    // EXPWOP: show IGST column but always at 0%
    if (this._context.documentClass === 'EXPWOP') {
      return { TaxPercentage1: 0, TaxAmount1: 0, TaxPercentage2: 0, TaxAmount2: 0, TotalTaxAmount: 0, TaxLabel: 'IGST 0%' };
    }

    const isZeroRated = this._context.invoiceType === 'NONGST';
    const taxCategoryForMaster = this.getTaxCategoryForAppliedMode(this._context.appliedTaxMode);
    const mode = this._context.appliedTaxMode;

    if (isZeroRated) {
      if (mode === 'VAT') {
        return { TaxPercentage1: 0, TaxAmount1: 0, TaxPercentage2: 0, TaxAmount2: 0, TotalTaxAmount: 0, TaxLabel: 'VAT 0%' };
      }
      if (mode === 'CGST_SGST') {
        return { TaxPercentage1: 0, TaxAmount1: 0, TaxPercentage2: 0, TaxAmount2: 0, TotalTaxAmount: 0, TaxLabel: 'CGST 0% + SGST 0%' };
      }
      if (mode === 'CGST_UGST') {
        return { TaxPercentage1: 0, TaxAmount1: 0, TaxPercentage2: 0, TaxAmount2: 0, TotalTaxAmount: 0, TaxLabel: 'CGST 0% + UGST 0%' };
      }
      if (mode === 'IGST') {
        return { TaxPercentage1: 0, TaxAmount1: 0, TaxPercentage2: 0, TaxAmount2: 0, TotalTaxAmount: 0, TaxLabel: 'IGST 0%' };
      }
      return zero;
    }

    const matches = this.workingTaxMasters.filter(
      (t: any) =>
        Number(t.TaxGroupSid) === Number(input.taxGroupSid) &&
        t.TaxCategory === taxCategoryForMaster
    );

    if (!matches.length) return zero;

    const taxable = input.taxableAmount || 0;

    if (mode === 'VAT') {
      const vatRecord = matches.find((t: any) => t.TaxCode === 'VAT');
      const vatRate = parseFloat(vatRecord?.TaxRate || 0);
      const vatAmt = (taxable * vatRate) / 100;
      return {
        TaxPercentage1: vatRate,
        TaxAmount1: vatAmt,
        TaxPercentage2: 0,
        TaxAmount2: 0,
        TotalTaxAmount: vatAmt,
        TaxLabel: `VAT ${vatRate}%`,
      };
    }

    if (mode === 'CGST_SGST') {
      const cgstRecord = matches.find((t: any) => t.TaxCode === 'CGST');
      const sgstRecord = matches.find((t: any) => t.TaxCode === 'SGST');
      const cgstRate = parseFloat(cgstRecord?.TaxRate || 0);
      const sgstRate = parseFloat(sgstRecord?.TaxRate || 0);
      const cgstAmt = (taxable * cgstRate) / 100;
      const sgstAmt = (taxable * sgstRate) / 100;
      return {
        TaxPercentage1: cgstRate,
        TaxAmount1: cgstAmt,
        TaxPercentage2: sgstRate,
        TaxAmount2: sgstAmt,
        TotalTaxAmount: cgstAmt + sgstAmt,
        TaxLabel:
          cgstRate || sgstRate
            ? `CGST ${cgstRate}% + SGST ${sgstRate}%`
            : 'CGST 0% + SGST 0%',
      };
    }

    if (mode === 'CGST_UGST') {
      const cgstRecord = matches.find((t: any) => t.TaxCode === 'CGST');
      const ugstRecord = matches.find((t: any) => t.TaxCode === 'UGST');
      const cgstRate = parseFloat(cgstRecord?.TaxRate || 0);
      const ugstRate = parseFloat(ugstRecord?.TaxRate || 0);
      const cgstAmt = (taxable * cgstRate) / 100;
      const ugstAmt = (taxable * ugstRate) / 100;
      return {
        TaxPercentage1: cgstRate,
        TaxAmount1: cgstAmt,
        TaxPercentage2: ugstRate,
        TaxAmount2: ugstAmt,
        TotalTaxAmount: cgstAmt + ugstAmt,
        TaxLabel:
          cgstRate || ugstRate
            ? `CGST ${cgstRate}% + UGST ${ugstRate}%`
            : 'CGST 0% + UGST 0%',
      };
    }

    if (mode === 'IGST') {
      const igstRecord = matches.find((t: any) => t.TaxCode === 'IGST');
      const igstRate = parseFloat(igstRecord?.TaxRate || 0);
      const igstAmt = (taxable * igstRate) / 100;
      return {
        TaxPercentage1: igstRate,
        TaxAmount1: igstAmt,
        TaxPercentage2: 0,
        TaxAmount2: 0,
        TotalTaxAmount: igstAmt,
        TaxLabel: `IGST ${igstRate}%`,
      };
    }

    return zero;
  }

  // ── calculateTotals() ─────────────────────────────────────────────────────

  calculateTotals(rows: RowTaxResult[]): VoucherTaxTotals {
    let totalTaxAmount1 = 0;
    let totalTaxAmount2 = 0;
    for (const r of rows) {
      totalTaxAmount1 += r.TaxAmount1;
      totalTaxAmount2 += r.TaxAmount2;
    }
    return {
      totalTaxAmount1,
      totalTaxAmount2,
      totalTaxAmount: totalTaxAmount1 + totalTaxAmount2,
      totalLocalAmount: 0,
      totalAmountWithTax: 0,
    };
  }

  // ── getTaxDisplayConfig() ─────────────────────────────────────────────────

  getTaxDisplayConfig(): {
    showCGST: boolean;
    showSGST: boolean;
    showUGST: boolean;
    showIGST: boolean;
    showVAT: boolean;
  } {
    if (!this._context) {
      return { showCGST: false, showSGST: false, showUGST: false, showIGST: false, showVAT: false };
    }

    const mode = this._context.appliedTaxMode;

    if (mode === 'VAT') {
      return { showCGST: false, showSGST: false, showUGST: false, showIGST: false, showVAT: true };
    }
    if (mode === 'CGST_SGST') {
      return { showCGST: true, showSGST: true, showUGST: false, showIGST: false, showVAT: false };
    }
    if (mode === 'CGST_UGST') {
      return { showCGST: true, showSGST: false, showUGST: true, showIGST: false, showVAT: false };
    }
    if (mode === 'IGST') {
      return { showCGST: false, showSGST: false, showUGST: false, showIGST: true, showVAT: false };
    }

    // NONE or default — show based on regime
    if (this._context.company.taxRegime === 'GST') {
      return { showCGST: true, showSGST: true, showUGST: false, showIGST: true, showVAT: false };
    }
    return { showCGST: false, showSGST: false, showUGST: false, showIGST: false, showVAT: true };
  }

  // ── Classification Logic (private) ────────────────────────────────────────

  private deriveClassification(): TaxClassification {
    const ctx = this._context!;
    const company = ctx.company;
    const party = ctx.party;

    // Step 1 — Trade Flow
    const sameCountry =
      (party.countryCode || '').toLowerCase() === company.countryCode ||
      !party.countryCode;
    let tradeFlow: TradeFlow;
    if (sameCountry) {
      tradeFlow = 'DOMESTIC';
    } else if (ctx.documentSide === 'SALES') {
      tradeFlow = 'EXPORT';
    } else {
      tradeFlow = 'IMPORT';
    }

    // Step 2 — Tax Category (for VoucherHeader.State)
    const taxCategory = this.determineTaxCategory(
      company.stateName,
      party.stateName,
      party.countryCode,
      company.stateMasterSid,
      party.stateMasterSid
    );

    // Step 3 — Document Class + Applied Tax Mode
    let documentClass: DocumentClass = 'B2B';
    let appliedTaxMode: AppliedTaxMode;
    let formGSTType = '';
    let isRCM = false;

    if (company.taxRegime === 'VAT') {
      // Non-India: VAT for domestic, zero tax for overseas party
      documentClass = 'VAT';
      if (ctx.invoiceType === 'BOS' || ctx.invoiceType === 'EXE' || ctx.invoiceType === 'OOS') {
        // Exempt / Out of Scope — no tax rows
        appliedTaxMode = 'NONE';
      } else if (ctx.invoiceType === 'NONGST') {
        // Zero Rated: show VAT columns with 0% amounts for domestic
        appliedTaxMode = sameCountry ? 'VAT' : 'NONE';
      } else {
        appliedTaxMode = sameCountry ? 'VAT' : 'NONE';
      }
      formGSTType = 'VAT';
    } else {
      // India GST
      let stateTaxMode: AppliedTaxMode;
      if (party.isUnionTerritory) {
        stateTaxMode = 'CGST_UGST';
      } else if (taxCategory === 'Inter') {
        stateTaxMode = 'IGST';
      } else {
        stateTaxMode = 'CGST_SGST';
      }

      if (ctx.invoiceType === 'BOS') {
        documentClass = this.hasValidGST(party) ? 'B2B' : 'B2C';
        appliedTaxMode = 'NONE';
        formGSTType = '';
      } else if (ctx.invoiceType === 'NONGST') {
        // Zero Rated: use real tax mode so columns show with 0% amounts
        documentClass = this.hasValidGST(party) ? 'B2B' : 'B2C';
        appliedTaxMode = stateTaxMode;
        formGSTType = '';
      } else if (tradeFlow === 'EXPORT' || tradeFlow === 'IMPORT') {
        // Export/Import
        if (this.getExportGstType(party) === 'EXPWOP') {
          documentClass = 'EXPWOP';
          appliedTaxMode = 'IGST'; // show IGST column at 0%
          formGSTType = 'EXPWOP';
        } else {
          documentClass = 'EXPWP';
          appliedTaxMode = 'IGST';
          formGSTType = 'EXPWP';
        }
      } else if (party.customerGstType === 'SEZ') {
        // SEZ — domestic but treated like export
        if (this.getExportGstType(party) === 'EXPWOP') {
          documentClass = 'EXPWOP';
          appliedTaxMode = 'IGST'; // show IGST column at 0%
          formGSTType = 'EXPWOP';
        } else {
          documentClass = 'EXPWP';
          appliedTaxMode = 'IGST';
          formGSTType = 'EXPWP';
        }
      } else if (
        party.customerGstType === 'Exempt' ||
        party.customerGstType === 'Composite'
      ) {
        documentClass = this.hasValidGST(party) ? 'B2B' : 'B2C';
        appliedTaxMode = 'NONE';
        formGSTType = '';
      } else if (
        party.customerGstType === 'RCM Others' ||
        party.customerGstType === 'RCM Specified'
      ) {
        documentClass = 'RCM';
        appliedTaxMode = stateTaxMode;
        formGSTType = 'RCM';
        isRCM = true;
      } else if (this.hasValidGST(party)) {
        // Regular + has GST number → B2B
        documentClass = 'B2B';
        appliedTaxMode = stateTaxMode;
        formGSTType = 'B2B';
      } else {
        // Regular + no GST number → B2C
        documentClass = 'B2C';
        appliedTaxMode = stateTaxMode;
        formGSTType = 'B2C';
      }
    }

    // Update context
    ctx.tradeFlow = tradeFlow;
    ctx.taxCategory = taxCategory;
    ctx.documentClass = documentClass;
    ctx.appliedTaxMode = appliedTaxMode;
    ctx.isRCM = isRCM;

    return {
      documentClass,
      appliedTaxMode,
      taxCategory,
      tradeFlow,
      formGSTType,
      isRCM,
    };
  }

  /**
   * Determine tax category: same state → 'Intra', different state → 'Inter'.
   * International → 'Inter'.
   */
  determineTaxCategory(
    companyState: string,
    billingPartyState: string,
    customerCountry: string,
    companyStateMasterSid?: number,
    partyStateMasterSid?: number
  ): TaxCategory {
    const normalizedCustomerCountry = (customerCountry || '').toLowerCase();
    const isIndianCustomer =
      normalizedCustomerCountry === 'in' ||
      normalizedCustomerCountry === 'india' ||
      normalizedCustomerCountry === '';

    if (!isIndianCustomer) {
      return 'Inter';
    }

    if (companyStateMasterSid && partyStateMasterSid) {
      return Number(companyStateMasterSid) === Number(partyStateMasterSid)
        ? 'Intra'
        : 'Inter';
    }

    if (!companyState || !billingPartyState) {
      return 'Intra';
    }

    const normalizedCompanyState = companyState.trim().toLowerCase();
    const normalizedBillingState = billingPartyState.trim().toLowerCase();
    return normalizedCompanyState === normalizedBillingState ? 'Intra' : 'Inter';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private hasValidGST(party: PartyTaxProfile): boolean {
    return !!(
      party.gstNumber &&
      party.gstNumber.trim() !== '' &&
      party.gstNumber !== 'undefined'
    );
  }

  private isWithoutPaymentProfile(party: PartyTaxProfile): boolean {
    return party.customerGstType === 'Zero Rated';
  }

  private getExportGstType(party: PartyTaxProfile): 'EXPWP' | 'EXPWOP' {
    if (party.selectedGstType === 'EXPWP' || party.selectedGstType === 'EXPWOP') {
      return party.selectedGstType;
    }

    return this.isWithoutPaymentProfile(party) ? 'EXPWOP' : 'EXPWP';
  }

  private getTaxCategoryForAppliedMode(mode: AppliedTaxMode): TaxCategory {
    if (mode === 'IGST') {
      return 'Inter';
    }

    if (mode === 'CGST_SGST' || mode === 'CGST_UGST') {
      return 'Intra';
    }

    return this._context?.taxCategory || 'Intra';
  }

  private emptyClassification(): TaxClassification {
    return {
      documentClass: 'B2B',
      appliedTaxMode: 'NONE',
      taxCategory: 'Intra',
      tradeFlow: 'DOMESTIC',
      formGSTType: '',
      isRCM: false,
    };
  }

  // ── Retained utility methods (used by other parts of the app) ─────────────

  filterPendingCharges(
    charges: BookingRateDetails[],
    billingPartySid: number,
    type: 'revenue' | 'cost' = 'revenue'
  ): BookingRateDetails[] {
    return charges.filter((charge: any) => {
      const billingPartyField =
        type === 'revenue'
          ? charge.RevenueCustomerMasterSid
          : charge.CostAgentMasterSid;
      return billingPartyField === billingPartySid;
    });
  }

  getUniqueBillingParties(
    charges: BookingRateDetails[],
    type: 'revenue' | 'cost' = 'revenue'
  ): number[] {
    const uniqueParties = new Set<number>();
    charges.forEach((charge: any) => {
      const billingPartySid =
        type === 'revenue'
          ? charge.RevenueCustomerMasterSid
          : charge.CostAgentMasterSid;
      if (billingPartySid) {
        uniqueParties.add(billingPartySid);
      }
    });
    return Array.from(uniqueParties);
  }

  generateInvoiceNumber(companyCode?: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    const prefix = companyCode || 'INV';
    return `${prefix}${year}${month}${timestamp}`;
  }
}
