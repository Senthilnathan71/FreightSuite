import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class NumberToWordsService {

  private ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
    'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  private tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  private scalesInternational = ['', 'Thousand', 'Million', 'Billion'];
  private scalesIndian = ['', 'Thousand', 'Lakh', 'Crore'];

  private currencyList : any[] = [];

  constructor() {}

  initializeCurrencies(currenies : any[]){
    this.currencyList = currenies;
    console.log("Inside Number to Words service",{
      currencies : this.currencyList
    })
  }

  convert(num: number, CurrencyMasterSid?: number): string {
    if (num === 0) return 'Zero';

    let words = '';
    let scaleIndex = 0;

    // Indian Numbering System
    const chunks = this.splitIndian(num);

    for (let i = chunks.length - 1; i >= 0; i--) {
      const chunk = chunks[i];
      if (chunk !== 0) {
        words += this.convertChunk(chunk) + ' ' + this.scalesIndian[i] + ' ';
      }
    }

    const ourCurrency = (this.currencyList || []).find(c => c.CurrencyMasterSid === CurrencyMasterSid);
    const unit = ourCurrency?.CurrencyUnit;
    const subUnit = ourCurrency?.CurrencySubUnit;
    return `${unit} ${words.trim()} ${subUnit}`;
  }


  private convertChunk(num: number): string {
    let words = '';

    if (num >= 100) {
      words += this.ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
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

  // Split number according to Indian Numbering System
  private splitIndian(num: number): number[] {
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
