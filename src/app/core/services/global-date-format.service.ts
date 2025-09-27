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

  formatDate(date: Date | string | null, customFormat?: string): string {
    if (!date) return '';

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    const format = customFormat || this.getCurrentDateFormat();

    const day = this.padZero(dateObj.getDate());
    const month = this.padZero(dateObj.getMonth() + 1);
    const year = dateObj.getFullYear();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`;
      case 'MM-DD-YYYY':
        return `${month}-${day}-${year}`;
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      case 'MM.DD.YYYY':
        return `${month}.${day}.${year}`;
      case 'DD MMM YYYY':
        return `${day} ${monthNames[dateObj.getMonth()]} ${year}`;
      case 'DD-MMM-YYYY':
        return `${day}-${monthNames[dateObj.getMonth()]}-${year}`;
      case 'MMM DD, YYYY':
        return `${monthNames[dateObj.getMonth()]} ${day}, ${year}`;
      case 'MMMM DD, YYYY':
        return `${fullMonthNames[dateObj.getMonth()]} ${day}, ${year}`;
      default:
        return `${day}/${month}/${year}`;
    }
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
}