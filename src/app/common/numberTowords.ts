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
      c => c?.CurrencyMasterSid === CurrencyMasterSid
    );

    const unit = currency?.CurrencyUnit?.trim() || '';
    const subUnit = currency?.CurrencySubUnit?.trim() || '';
    const subUnitIn = this.parseSubUnitIn(currency?.SubUnitIn);

    /* ---------------- Integer Part ---------------- */
    const integerNum = Math.floor(amount);
    let result = '';
    
    result = this.convertInteger(integerNum);
    if (unit) {
      result += ` ${unit} `;
    }


    /* ---------------- Decimal Part (FIXED) ---------------- */
    if (subUnitIn > 0 && subUnit) {
      const multiplier = Math.pow(10, subUnitIn);
      const decimalNum = Math.round((amount - integerNum) * multiplier);

      if (decimalNum > 0) {
        console.log(decimalNum)
        const decimalWords = this.convertSmallNumber(decimalNum);
        result += ` and ${decimalWords} ${subUnit}`;
      }
    }

    result += ' only'

    if (isNegative) {
      result = 'Minus ' + result;
    }

    return result.trim();
  }

  /* ---------------------------------------------
   * Integer conversion (Indian system)
   * --------------------------------------------- */
  private convertInteger(num: number): string {
    if (num === 0) return 'Zero';

    const chunks = this.splitIndian(num);
    let words = '';

    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] !== 0) {
        words +=
          this.convertChunk(chunks[i]) +
          (this.scalesIndian[i] ? ' ' + this.scalesIndian[i] : '') +
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
      words += this.ones[Math.floor(num / 100)] + ' Hundred';
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
  private convertSmallNumber(num: number): string {
    if (num === 0) return 'Zero';

    let words = '';
    const chunks = this.splitIndian(num);

    for (let i = chunks.length - 1; i >= 0; i--) {
      if (chunks[i] !== 0) {
        words += this.convertChunk(chunks[i]) + ' ';
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

  /* ---------------------------------------------
   * Safe SubUnitIn parsing
   * --------------------------------------------- */
  private parseSubUnitIn(value: any): number {
    const parsed = Number(value);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.min(parsed, 10);
  }
}
