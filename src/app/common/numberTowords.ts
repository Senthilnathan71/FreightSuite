import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NumberToWordsService {

  private ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  private tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  private scalesIndian = ['', 'Thousand', 'Lakh', 'Crore'];
  private scalesInternational = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

  private currencyList: any[] = [];

  constructor() {}

  /* ---------------------------------------------
   * Initialize currency master
   * --------------------------------------------- */
  initializeCurrencies(currencies: any[]) {
    this.currencyList = currencies || [];
  }

  /* ---------------------------------------------
   * MAIN CONVERTER
   * --------------------------------------------- */
  convert(amount: number | null | undefined, CurrencyMasterSid?: number | null): string {

    if (amount == null || isNaN(amount)) {
      return 'Zero';
    }

    const isNegative = amount < 0;
    amount = Math.abs(amount);

    if (amount >= 1e15) {
      return 'Amount too large';
    }

    /* ---------------- Currency ---------------- */
    const currency = this.currencyList.find(
      c => String(c?.CurrencyMasterSid) === String(CurrencyMasterSid)
    );

    const currencyCode = this.getCurrencyCode(currency);
    const unit = this.getCurrencyUnit(currency, currencyCode);
    const subUnit = currency?.CurrencySubUnit?.trim() || '';
    const rawSubUnitIn = currency?.SubUnitIn;
    const subUnitIn = this.getSubUnitDigits(rawSubUnitIn, currency?.amountDecimal);
    const effectiveSubUnitIn = this.getEffectiveSubUnitIn(currencyCode, subUnit, subUnitIn);
    const useIndianWords = this.shouldUseIndianWords(currencyCode, unit);

    /* ---------------- Integer Part ---------------- */
    const integerNum = Math.floor(amount);
    let result = '';
    
    result = this.convertInteger(integerNum, useIndianWords);
    if (unit) {
      result += ` ${unit} `;
    }


    /* ---------------- Decimal Part ---------------- */
    if (effectiveSubUnitIn > 0 && subUnit) {
      const parts = amount.toFixed(effectiveSubUnitIn).split('.');
      const decimalNum = parts[1] ? parseInt(parts[1], 10) : 0;

      if (decimalNum > 0) {
        const decimalWords = this.convertSmallNumber(decimalNum, useIndianWords);
        result += ` and ${decimalWords} ${subUnit}`;
      }
    }

    result += ' Only'

    if (isNegative) {
      result = 'Minus ' + result;
    }

    return result.trim();
  }

  /* ---------------------------------------------
   * Integer conversion (Indian system)
   * --------------------------------------------- */
  private convertInteger(num: number, useIndianWords = true): string {
    if (num === 0) return 'Zero';

    const chunks = useIndianWords ? this.splitIndian(num) : this.splitInternational(num);
    const scales = useIndianWords ? this.scalesIndian : this.scalesInternational;
    let words = '';

    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] !== 0) {
        words +=
          this.convertChunk(chunks[i]) +
          (scales[i] ? ' ' + scales[i] : '') +
          ' ';
      }
    }

    return words.trim();
  }

  /* ---------------------------------------------
   * Convert numbers < 1000
   * --------------------------------------------- */
  private convertChunk(num: number): string {
    let words = '';

    if (num >= 100) {
      words += this.ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
      // if (num > 0) words += ' and ';
    }

    if (num >= 20) {
      words += this.tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }

    if (num > 0) {
      words += this.ones[num] + ' ';
    }

    return words.trim();
  }

  /* ---------------------------------------------
   * Convert decimal numbers
   * --------------------------------------------- */
  private convertSmallNumber(num: number, useIndianWords = true): string {
    if (num === 0) return 'Zero';

    let words = '';
    const chunks = useIndianWords ? this.splitIndian(num) : this.splitInternational(num);
    const scales = useIndianWords ? this.scalesIndian : this.scalesInternational;

    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] !== 0) {
        words += this.convertChunk(chunks[i]) + (scales[i] ? ' ' + scales[i] : '') + ' ';
      }
    }

    return words.trim();
  }


  /* ---------------------------------------------
   * Indian number split
   * --------------------------------------------- */
  private splitIndian(num: number): number[] {
    const chunks: number[] = [];

    chunks.push(num % 1000);
    num = Math.floor(num / 1000);

    while (num > 0) {
      chunks.push(num % 100);
      num = Math.floor(num / 100);
    }

    return chunks;
  }

  private splitInternational(num: number): number[] {
    const chunks: number[] = [];

    while (num > 0) {
      chunks.push(num % 1000);
      num = Math.floor(num / 1000);
    }

    return chunks;
  }

  private getCurrencyCode(currency: any): string {
    return String(
      currency?.CurrencyCode ||
      currency?.currencyCode ||
      currency?.Code ||
      currency?.code ||
      currency?.CurrencyName ||
      ''
    ).trim().toUpperCase();
  }

  private getCurrencyUnit(currency: any, currencyCode: string): string {
    const unit = currency?.CurrencyUnit?.trim() || '';

    if (currencyCode === 'UAE' && unit && !unit.toUpperCase().startsWith('UAE ')) {
      return `UAE ${unit}`;
    }

    return unit;
  }

  private shouldUseIndianWords(currencyCode: string, unit: string): boolean {
    const normalizedUnit = unit.trim().toUpperCase();
    return currencyCode === 'INR' || currencyCode === 'IND' || normalizedUnit === 'RUPEES' || normalizedUnit === 'RUPEE';
  }

  /* ---------------------------------------------
   * Safe SubUnitIn parsing
   * --------------------------------------------- */
  private getSubUnitDigits(subUnitIn: any, fallbackDecimals?: number): number {
    const parsed = Number(subUnitIn);
    if (!isFinite(parsed) || parsed <= 0) {
      if (typeof fallbackDecimals === 'number' && fallbackDecimals >= 0) {
        return Math.min(Math.floor(fallbackDecimals), 4);
      }
      return 0;
    }

    // Values >= 10 are treated as a subunit ratio (e.g. 100 paise = 1 rupee → 2 decimal places).
    // This also prevents a raw decimal-places value like "10" from being used directly,
    // which would cause floating-point noise in toFixed(10) on large amounts.
    if (parsed >= 10) {
      const log10 = Math.round(Math.log10(parsed));
      if (Math.pow(10, log10) === parsed) {
        return Math.min(log10, 4);
      }
      return 0;
    }

    // Values 1–9: treat as explicit decimal place count
    if (Number.isInteger(parsed)) {
      return Math.min(parsed, 4);
    }

    return 0;
  }

  private getEffectiveSubUnitIn(currencyCode: string, subUnit: string, subUnitIn: number): number {
    if (subUnitIn <= 0) {
      return 0;
    }

    const normalizedSubUnit = subUnit.trim().toUpperCase();
    if (
      currencyCode === 'INR' ||
      currencyCode === 'IND' ||
      normalizedSubUnit === 'PAISE' ||
      normalizedSubUnit === 'PAISES'
    ) {
      return 2;
    }

    // Cap at 4: no real-world currency uses more than 4 decimal places, and
    // toFixed() beyond ~6 introduces floating-point noise for million-range amounts.
    return Math.min(subUnitIn, 4);
  }
}

