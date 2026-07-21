import { inject, Injectable } from "@angular/core";
import { NgbDateParserFormatter, NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { GlobalDateFormatService } from "src/app/core/services/global-date-format.service";

@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {

  private globalDateService = inject(GlobalDateFormatService);

  private readonly MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                             'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  /**
   * Accepts what format() produces, not just the legacy dd-MMM-yyyy shape.
   *
   * format() renders through GlobalDateFormatService (typically dd/MM/yyyy), but parse() used
   * to split on '-' and expect a three-letter month, so any date the user typed — including
   * one it had just rendered itself — resolved to null and silently emptied the control while
   * the typed text stayed on screen. Handled forms: dd-MMM-yyyy, dd/MM/yyyy, dd-MM-yyyy,
   * dd.MM.yyyy and yyyy-MM-dd.
   */
  parse(value: string): NgbDateStruct | null {
    if (!value) return null;

    const parts = value.toUpperCase().trim().split(/[-/.]/);
    if (parts.length !== 3) return null;

    // ISO-style yyyy-MM-dd (4-digit first segment)
    if (parts[0].length === 4) {
      return this.buildDate(+parts[2], +parts[1], +parts[0]);
    }

    const day = +parts[0];
    const year = +parts[2];

    // Named month (dd-MMM-yyyy) or numeric month (dd/MM/yyyy)
    const namedMonth = this.MONTHS.indexOf(parts[1]) + 1;
    const month = namedMonth > 0 ? namedMonth : +parts[1];

    return this.buildDate(day, month, year);
  }

  private buildDate(day: number, month: number, year: number): NgbDateStruct | null {
    if (!day || !month || !year) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    return { year, month, day };
  }

  format(date: NgbDateStruct | null): string {
    if (!date) {
      return '';
    }

    const jsDate = new Date(date.year, date.month - 1, date.day);
    return this.globalDateService.formatDate(jsDate);
  }
}

