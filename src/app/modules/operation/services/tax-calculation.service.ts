import { Injectable } from '@angular/core';

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
      ChargeTaxMasterSid : number;
      HSNCode : string;
      HSSACMasterSid : number;
      TaxGroup : string;
      TaxGroupSid : number;
      TaxRate : string;
      description : string;
    }>;
  };
  customerMaster?: BillingPartyDetails;
}

export interface TaxCalculationParams {
  companyMasterSid: number;
  branchMasterSid: number;
  billingParty: BillingPartyDetails;
  charges: BookingRateDetails[];
}

export interface GSTLineItem {
  description: string;
  hsn: string;
  amount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
}

export interface VATLineItem {
  description: string;
  hsn: string;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalTaxAmount: number;
}

export interface GSTResult {
  type: 'GST';
  isInterState: boolean;
  isSameState: boolean;
  lineItems: GSTLineItem[];
  subtotal: number;
  totalAmount: number;
  totalCGST: number;
  totalCGSTAmount: number;
  totalSGST: number;
  totalSGSTAmount: number;
  totalIGST: number;
  totalIGSTAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  totalInvoiceAmount: number;
}

export interface VATResult {
  type: 'VAT';
  lineItems: VATLineItem[];
  subtotal: number;
  totalAmount: number;
  totalVAT: number;
  totalVATAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  totalInvoiceAmount: number;
  vatRate: number;
}

export type TaxCalculationResult = GSTResult | VATResult;

@Injectable({
  providedIn: 'root'
})
export class TaxCalculationService {

  constructor() { }

  /**
   * Main method to calculate tax based on company location and billing party
   */
  calculateTax(params: TaxCalculationParams): TaxCalculationResult {
    const companyCountry = this.getCompanyCountry(params.companyMasterSid);
    const taxType = this.determineTaxType(companyCountry);

    if (taxType === 'GST') {
      return this.calculateGST(params);
    } else {
      return this.calculateVAT(params);
    }
  }

  /**
   * Determine tax type based on company country
   */
  determineTaxType(companyCountry: string): 'GST' | 'VAT' {
    const country = companyCountry.toLowerCase().trim();

    if (country === 'india') {
      return 'GST';
    } else if (country === 'uae' || country === 'dubai' || country === 'united arab emirates') {
      return 'VAT';
    }

    // Default to VAT for other countries
    return 'VAT';
  }

  /**
   * Calculate GST for Indian companies
   */
  calculateGST(params: TaxCalculationParams): GSTResult {
    const { billingParty, charges } = params;

    // Get company and billing party states
    const companyState = this.getCompanyState(params.companyMasterSid, params.branchMasterSid);
    const billingPartyState = billingParty.StateName?.toLowerCase().trim();

    // Determine if it's inter-state transaction
    const isInterState = companyState !== billingPartyState;

    const lineItems: GSTLineItem[] = [];
    let totalAmount = 0;
    let totalCGSTAmount = 0;
    let totalSGSTAmount = 0;
    let totalIGSTAmount = 0;

    charges.forEach(charge => {
      const amount = Number(charge.RevenueLocalAmount) || 0;
      totalAmount += amount;

      // Get tax rate from charge master or default
      const taxRate = this.getChargeTaxRate(charge);

      let cgstRate = 0;
      let sgstRate = 0;
      let igstRate = 0;
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;

      if (isInterState) {
        // Inter-state: IGST
        igstRate = taxRate;
        igstAmount = (amount * igstRate) / 100;
        totalIGSTAmount += igstAmount;
      } else {
        // Intra-state: CGST + SGST
        cgstRate = taxRate / 2;
        sgstRate = taxRate / 2;
        cgstAmount = (amount * cgstRate) / 100;
        sgstAmount = (amount * sgstRate) / 100;
        totalCGSTAmount += cgstAmount;
        totalSGSTAmount += sgstAmount;
      }

      const totalTaxAmount = cgstAmount + sgstAmount + igstAmount;

      lineItems.push({
        description: charge.ChargeDescription,
        hsn: this.getChargeHSN(charge),
        amount,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTaxAmount
      });
    });

    const totalTaxAmount = totalCGSTAmount + totalSGSTAmount + totalIGSTAmount;
    const totalInvoiceAmount = totalAmount + totalTaxAmount;

    return {
      type: 'GST',
      isInterState,
      isSameState: !isInterState,
      lineItems,
      subtotal: totalAmount,
      totalAmount,
      totalCGST: totalCGSTAmount,
      totalCGSTAmount,
      totalSGST: totalSGSTAmount,
      totalSGSTAmount,
      totalIGST: totalIGSTAmount,
      totalIGSTAmount,
      totalTaxAmount,
      grandTotal: totalInvoiceAmount,
      totalInvoiceAmount
    };
  }

  /**
   * Calculate VAT for UAE/Dubai companies
   */
  calculateVAT(params: TaxCalculationParams): VATResult {
    const { charges } = params;

    const lineItems: VATLineItem[] = [];
    let totalAmount = 0;
    let totalVATAmount = 0;

    // Get VAT rate (standard 5% for UAE/Dubai)
    const vatRate = this.getVATRate();

    charges.forEach(charge => {
      const amount = Number(charge.RevenueLocalAmount) || 0;
      totalAmount += amount;

      const vatAmount = (amount * vatRate) / 100;
      totalVATAmount += vatAmount;

      lineItems.push({
        description: charge.ChargeDescription,
        hsn: this.getChargeHSN(charge),
        amount,
        vatRate,
        vatAmount,
        totalTaxAmount: vatAmount
      });
    });

    const totalInvoiceAmount = totalAmount + totalVATAmount;

    return {
      type: 'VAT',
      lineItems,
      subtotal: totalAmount,
      totalAmount,
      totalVAT: totalVATAmount,
      totalVATAmount,
      totalTaxAmount: totalVATAmount,
      grandTotal: totalInvoiceAmount,
      totalInvoiceAmount,
      vatRate
    };
  }

  /**
   * Filter charges for pending invoices (no voucher created)
   * Revenue: uses CustomerMasterSid, Cost: uses AgentMasterSid
   */
  filterPendingCharges(charges: BookingRateDetails[], billingPartySid: number, type: 'revenue' | 'cost' = 'revenue'): BookingRateDetails[] {
    return charges.filter((charge: any) => {
        const billingPartyField = type === 'revenue' ? charge.RevenueCustomerMasterSid : charge.CostAgentMasterSid;
        return billingPartyField === billingPartySid;
    });
  }

  /**
   * Get unique billing parties from charges
   * Revenue: uses CustomerMasterSid, Cost: uses AgentMasterSid
   */
  getUniqueBillingParties(charges: BookingRateDetails[], type: 'revenue' | 'cost' = 'revenue'): number[] {
    const uniqueParties = new Set<number>();
      charges.forEach((charge: any) => {
        const billingPartySid = type === 'revenue' ? charge.RevenueCustomerMasterSid : charge.CostAgentMasterSid;
        if (billingPartySid) {
          uniqueParties.add(billingPartySid);
        }
      });
    return Array.from(uniqueParties);
  }

  /**
   * Generate invoice number
   */
  generateInvoiceNumber(companyCode?: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);

    const prefix = companyCode || 'INV';
    return `${prefix}${year}${month}${timestamp}`;
  }

  // Private helper methods

  private getCompanyCountry(companyMasterSid: number): string {
    try {
      const company = JSON.parse(localStorage.getItem('selected-company') || '{}');
      return company?.countryMaster?.CountryName || company?.countryName || 'india';
    } catch {
      return 'india';
    }
  }

  private getCompanyState(companyMasterSid: number, branchMasterSid: number): string {
    try {
      const branch = JSON.parse(localStorage.getItem('selected-branch') || '{}');
      return branch?.stateMaster?.StateName?.toLowerCase().trim() ||
             branch?.stateName?.toLowerCase().trim() || 'maharashtra';
    } catch {
      return 'maharashtra';
    }
  }

  private getChargeTaxRate(charge: BookingRateDetails): number {
    // Try to get tax rate from charge master tax mapping
    if (charge.ChargeMaster?.chargeTaxMaster?.length > 0) {
      const taxMapping = charge.ChargeMaster.chargeTaxMaster[0];
      if (taxMapping.TaxRate) {
        return Number(taxMapping.TaxRate);
      }
    }

    // Default tax rates based on charge type
    const chargeName = charge.ChargeDescription?.toLowerCase() || '';

    if (chargeName.includes('freight') || chargeName.includes('ocean freight')) {
      return 0; // Ocean freight is usually exempt or 0%
    } else if (chargeName.includes('documentation') || chargeName.includes('handling')) {
      return 18; // Service charges are usually 18%
    } else if (chargeName.includes('insurance')) {
      return 18; // Insurance services
    } else {
      return 18; // Default GST rate for services
    }
  }

  private getChargeHSN(charge: BookingRateDetails): string {
    // Try to get HSN from charge master
    if (charge.ChargeMaster?.HSNSAC) {
      return charge.ChargeMaster.HSNSAC;
    }

    // Try to get from tax mapping
    if (charge.ChargeMaster?.chargeTaxMaster?.length > 0) {
      const taxMapping = charge.ChargeMaster.chargeTaxMaster[0];
      if (taxMapping.HSNCode) {
        return taxMapping.HSNCode;
      }
    }

    // Default HSN codes based on charge type
    const chargeName = charge.ChargeDescription?.toLowerCase() || '';

    if (chargeName.includes('freight') || chargeName.includes('ocean freight')) {
      return '996511'; // Goods transport by sea
    } else if (chargeName.includes('documentation') || chargeName.includes('handling')) {
      return '996519'; // Other supporting transport services
    } else if (chargeName.includes('insurance')) {
      return '996411'; // Insurance services
    } else {
      return '996519'; // Default for freight forwarding services
    }
  }

  private getVATRate(): number {
    // Standard VAT rate for UAE/Dubai
    return 5;
  }
}