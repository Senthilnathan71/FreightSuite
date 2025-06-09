import { Injectable } from "@angular/core";
import { NgbDateParserFormatter, NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";

@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {

  private readonly MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                             'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  parse(value: string): NgbDateStruct | null {
    if (!value) return null;
    const parts = value.toUpperCase().split('-');
    if (parts.length !== 3) return null;
    const day = +parts[0];
    const month = this.MONTHS.indexOf(parts[1]) + 1;
    const year = +parts[2];
    if (!day || !month || !year) return null;
    return { year, month, day };
  }

  format(date: NgbDateStruct | null): string {
    if (!date) return '';
    const day = String(date.day).padStart(2, '0');
    const month = this.MONTHS[date.month - 1];
    return `${day}-${month}-${date.year}`;
  }
}

