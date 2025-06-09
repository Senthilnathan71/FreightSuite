import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatDate',
    standalone: true
})
export class CustomDatePipe implements PipeTransform {

    // Pipe to achieve this date format  : '09-JUN-2025'
    transform(value: Date | string | null): string {
        if(!value) return '';

        // Check if it is valid
        let date = new Date(value);
        if(isNaN(date.getTime())) return '';

        const monthInStr = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

        const day = this.padZero(date.getDate());
        const month = monthInStr[date.getMonth()]; //Get its respective string
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;

    }

    private padZero(value: number): string {
        return value < 10 ? `0${value}` : `${value}`;
    }

}
