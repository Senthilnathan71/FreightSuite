import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  private scalesInternational = ['', 'Thousand', 'Million', 'Billion'];
  private scalesIndian = ['', 'Thousand', 'Lakh', 'Crore'];

  private currencyList: any[] = [];

  constructor() {}

  initializeCurrencies(currenies: any[]) {
    this.currencyList = currenies || [];
    console.log('Inside Number to Words service', {
      currencies: this.currencyList,
    });
  }

  convert(
    amount: number | null | undefined,
    CurrencyMasterSid?: number | null
  ): string {
    // Handle null, undefined, NaN
    if (amount == null || isNaN(amount)) {
      return 'Zero';
    }

    // Handle negative numbers
    const isNegative = amount < 0;
    amount = Math.abs(amount);

    // Handle very large numbers (beyond supported range)
    if (amount >= 1e15) {
      return 'Amount too large';
    }

    // Find currency details
    const ourCurrency = (this.currencyList || []).find(
      (c) => c?.CurrencyMasterSid === CurrencyMasterSid
    );

    const unit = ourCurrency?.CurrencyUnit?.trim() || '';
    const subUnit = ourCurrency?.CurrencySubUnit?.trim() || '';
    const subUnitIn = this.parseSubUnitIn(ourCurrency?.SubUnitIn);

    // Split into integer and decimal parts using string manipulation
    const amountStr = amount.toString();
    const parts = amountStr.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1] || '';
    
    const integerNum = parseInt(integerPart) || 0;
    
    console.log('CONVERT', {
      amount,
      amountStr,
      integerPart,
      decimalPart,
      subUnitIn
    });

    // Convert integer part
    let result = '';
    if (integerNum === 0) {
      result = 'Zero';
    } else {
      const chunks = this.splitIndian(integerNum);
      let words = '';

      for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];
        if (chunk !== 0) {
          const chunkWords = this.convertChunk(chunk);
          const scale = this.scalesIndian[i];
          words += chunkWords + (scale ? ' ' + scale : '') + ' ';
        }
      }
      result = words.trim();
    }

    // Add unit if available
    if (unit) {
      result = `${result} ${unit}`;
    }

    // Handle decimal part if it exists and has significant digits
    if (decimalPart && subUnitIn > 0 && subUnit) {
      // Pad or truncate decimal based on SubUnitIn
      let decimalStr = decimalPart.padEnd(subUnitIn, '0').substring(0, subUnitIn);
      const decimalNum = parseInt(decimalStr) || 0;
      
      console.log('AFTER', {
        decimalPart,
        subUnit,
        subUnitIn,
        decimalStr,
        decimalNum
      });
      
      if (decimalNum > 0) {
        const decimalWords = this.convertSmallNumber(decimalNum);
        console.log('DECIMAL',{
          decimalWords
        });
        result += ` and ${decimalWords} ${subUnit}`;
      }
    }

    // Add negative prefix if needed
    if (isNegative) {
      result = 'Minus ' + result;
    }

    return result.trim();
  }

  // Safely parse SubUnitIn value
  private parseSubUnitIn(subUnitIn: any): number {
    if (subUnitIn == null) return 0;

    const parsed =
      typeof subUnitIn === 'string' ? parseInt(subUnitIn) : Number(subUnitIn);

    if (isNaN(parsed) || parsed < 0) return 0;
    if (parsed > 10) return 10; // Cap at reasonable limit

    return parsed;
  }

  // Convert numbers less than 1000
  private convertSmallNumber(num: number): string {
    if (num === 0 || isNaN(num)) return 'Zero';
    return this.convertChunk(num);
  }

  private convertChunk(num: number): string {
    // Handle edge cases
    if (num === 0 || isNaN(num)) return '';
    if (num < 0) num = Math.abs(num);
    if (num >= 1000) num = num % 1000; // Safety cap

    let words = '';
    const originalNum = num;

    if (num >= 100) {
      const hundredsDigit = Math.floor(num / 100);
      if (hundredsDigit > 0 && hundredsDigit < this.ones.length) {
        words += this.ones[hundredsDigit] + ' Hundred';
        num %= 100;
        // Only add "and" if there are remaining digits
        if (num > 0) {
          words += ' and ';
        } else {
          words += ' ';
        }
      }
    }

    if (num >= 20) {
      const tensDigit = Math.floor(num / 10);
      if (tensDigit > 0 && tensDigit < this.tens.length) {
        words += this.tens[tensDigit] + ' ';
      }
      num %= 10;
    }

    if (num > 0 && num < this.ones.length) {
      words += this.ones[num] + ' ';
    }

    return words.trim();
  }

  // Split number according to Indian Numbering System
  private splitIndian(num: number): number[] {
    // Handle edge cases
    if (num === 0 || isNaN(num)) return [0];
    if (num < 0) num = Math.abs(num);

    num = Math.floor(num); // Ensure integer

    const chunks: number[] = [];

    // first 3 digits
    chunks.push(num % 1000);
    num = Math.floor(num / 1000);

    // then groups of 2 digits
    while (num > 0) {
      chunks.push(num % 100);
      num = Math.floor(num / 100);
    }

    return chunks;
  }
}