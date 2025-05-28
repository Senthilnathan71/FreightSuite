import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true, // Makes the pipe available for standalone components
})
export class DateFormatPipe implements PipeTransform {

  transform(value: Date | string | null): string {
    if (!value) return '';

    let date = new Date(value);
    if (isNaN(date.getTime())) return ''; // Return empty if invalid date

    const day = this.padZero(date.getDate());
    const month = this.padZero(date.getMonth() + 1); // Month is 0-based
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

}
