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
    const subUnitIn = this.parseSubUnitIn(currency?.SubUnitIn);
    const useIndianWords = this.shouldUseIndianWords(currencyCode, unit);

    /* ---------------- Integer Part ---------------- */
    const integerNum = Math.floor(amount);
    let result = '';
    
    result = this.convertInteger(integerNum, useIndianWords);
    if (unit) {
      result += ` ${unit} `;
    }


    /* ---------------- Decimal Part (FIXED) ---------------- */
    if (subUnitIn > 0 && subUnit) {
      const multiplier = Math.pow(10, subUnitIn);
      const decimalNum = Math.round((amount - integerNum) * multiplier);

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
  private parseSubUnitIn(value: any): number {
    const parsed = Number(value);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.min(parsed, 10);
  }
}
