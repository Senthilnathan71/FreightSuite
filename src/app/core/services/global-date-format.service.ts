// global-date-format.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CompanyConfigService } from '../../modules/master/company/services/company-config.service';
import { AppSettingsService } from './app-settings.service';
import { normalizeTimezoneOffset, getOffsetMinutes } from 'src/app/common/helper';

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

  constructor(private configService: CompanyConfigService, private appSettings: AppSettingsService) {}

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
    branchOffset?: boolean;        // optional: render in the current branch's timezone (company-config offset)
  } = {}
): string {
  if (!dateInput) return '';

  const parsed = new Date(dateInput);
  if (isNaN(parsed.getTime())) return '';

  // When branchOffset is set, shift the stored UTC instant by the current branch's offset
  // (company configuration) and read it back via UTC getters, so the displayed clock is
  // company-local rather than browser-local. Default (false) keeps the original local behaviour.
  const useBranchTz = !!options.branchOffset;
  const date = useBranchTz
    ? new Date(parsed.getTime() + getOffsetMinutes(normalizeTimezoneOffset(this.appSettings.getCurrentBranchInfo()?.timeZone)) * 60 * 1000)
    : parsed;
  const gDate    = () => useBranchTz ? date.getUTCDate()     : date.getDate();
  const gMonth   = () => useBranchTz ? date.getUTCMonth()    : date.getMonth();
  const gYear    = () => useBranchTz ? date.getUTCFullYear() : date.getFullYear();
  const gHours   = () => useBranchTz ? date.getUTCHours()    : date.getHours();
  const gMinutes = () => useBranchTz ? date.getUTCMinutes()  : date.getMinutes();
  const gSeconds = () => useBranchTz ? date.getUTCSeconds()  : date.getSeconds();

  // ─────────────────────────────────────────────
  // 1. Get base date format from global config
  // ─────────────────────────────────────────────
  let dateFormat = options.customFormat || this.getCurrentDateFormat();

  // ─────────────────────────────────────────────
  // 2. Format date part using global format
  // ─────────────────────────────────────────────
  const pad = (n: number) => n.toString().padStart(2, '0');

  const replacements: Record<string, string> = {
    DD: pad(gDate()),
    MM: pad(gMonth() + 1),
    YYYY: gYear().toString(),
    YY: gYear().toString().slice(-2),
    MMM: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][gMonth()],
    MMMM: [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ][gMonth()],
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

    const hours24 = gHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = pad(gMinutes());
    const seconds = pad(gSeconds());
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