import { Pipe, PipeTransform, inject } from '@angular/core';
import { GlobalDateFormatService } from '../services/global-date-format.service';

@Pipe({
    name: 'formatDate',
    standalone: true
})
export class CustomDatePipe implements PipeTransform {

    private globalDateService = inject(GlobalDateFormatService);

    transform(value: Date | string | null, customFormat?: string): string {
        if (!value) return '';

        // Use global date format service for formatting
        return this.globalDateService.formatDate(value, customFormat);
    }

}
