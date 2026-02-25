// global-date-format.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CompanyConfigService } from '../../modules/master/company/services/company-config.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalDateFormatService {
  private dateFormatSubject = new BehaviorSubject<string>('DD/MM/YYYY');
  public dateFormat$ = this.dateFormatSubject.asObservable();

  private formatMapping: { [key: string]: string } = {
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd',
    'DD-MM-YYYY': 'dd-MM-yyyy',
    'MM-DD-YYYY': 'MM-dd-yyyy',
    'DD.MM.YYYY': 'dd.MM.yyyy',
    'MM.DD.YYYY': 'MM.dd.yyyy',
    'DD MMM YYYY': 'dd MMM yyyy',
    'DD-MMM-YYYY': 'dd-MMM-yyyy',
    'MMM DD, YYYY': 'MMM dd, yyyy',
    'MMMM DD, YYYY': 'MMMM dd, yyyy'
  };

  constructor(private configService: CompanyConfigService) {}

  setDateFormat(format: string): void {
    this.dateFormatSubject.next(format);
  }

  getCurrentDateFormat(): string {
    return this.dateFormatSubject.value;
  }

  getAngularDateFormat(): string {
    const currentFormat = this.getCurrentDateFormat();
    return this.formatMapping[currentFormat] || 'dd/MM/yyyy';
  }

  loadCompanyDateFormat(companyId: number): void {
    this.configService.getCompanyConfiguration(companyId).subscribe({
      next: (config) => {
        if (config?.systemSettings?.dateFormat) {
          this.setDateFormat(config.systemSettings.dateFormat);
        }
      },
      error: (error) => {
        console.warn('Could not load company date format, using default:', error);
      }
    });
  }

/**
 * Formats a date or datetime value.
 * The date portion uses the global application format.
 * Time (with 12-hour + AM/PM) is appended only when requested.
 */
formatDate(
  dateInput: Date | string | number | null | undefined,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    use24Hour?: boolean;           // optional: force 24-hour instead of 12-hour + tt
    customFormat?: string;         // optional: fully override (rare use)
  } = {}
): string {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  // ─────────────────────────────────────────────
  // 1. Get base date format from global config
  // ─────────────────────────────────────────────
  let dateFormat = options.customFormat || this.getCurrentDateFormat();

  // ─────────────────────────────────────────────
  // 2. Format date part using global format
  // ─────────────────────────────────────────────
  const pad = (n: number) => n.toString().padStart(2, '0');

  const replacements: Record<string, string> = {
    DD: pad(date.getDate()),
    MM: pad(date.getMonth() + 1),
    YYYY: date.getFullYear().toString(),
    YY: date.getFullYear().toString().slice(-2),
    MMM: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()],
    MMMM: [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ][date.getMonth()],
  };

  let datePart = dateFormat;
  for (const [token, value] of Object.entries(replacements)) {
    datePart = datePart.replace(new RegExp(`\\b${token}\\b`, 'g'), value);
  }

  // ─────────────────────────────────────────────
  // 3. Add time if requested
  // ─────────────────────────────────────────────
  if (options.includeTime) {
    let timeFormat = options.use24Hour ? 'HH:mm' : 'hh:mm tt';

    if (options.includeSeconds) {
      timeFormat += ':ss';
    }

    const hours24 = date.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    const meridian = hours24 >= 12 ? 'PM' : 'AM';

    const timePart = timeFormat
      .replace('HH', pad(hours24))
      .replace('hh', pad(hours12))
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace('tt', meridian);

    return `${datePart} ${timePart}`;
  }

  return datePart;
}

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}