import { NgbTimeStruct, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { DatePipe } from '@angular/common';

export interface NgbDateTimeStruct extends NgbDateStruct, NgbTimeStruct { }

export class DateTimeModel implements NgbDateTimeStruct {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;

    public constructor( init?: Partial<DateTimeModel>) {
        Object.assign(this, init);
    }

    public static fromUTCString(dateString: string): DateTimeModel {
        const date = new Date(dateString);
        const isValidDate = !isNaN(date.valueOf());

        if (!dateString || !isValidDate) {
            return null;
        }

        return new DateTimeModel({
            year: date.getUTCFullYear(),
            month: date.getUTCMonth() + 1,
            day: date.getUTCDate(),
            hour: date.getUTCHours(),
            minute: date.getUTCMinutes(),
            second: date.getUTCSeconds()
        });
    }


    public static fromLocalString(dateString: string): DateTimeModel {
        const date = new Date(dateString);

        const isValidDate = !isNaN(date.valueOf());

        if (!dateString || !isValidDate) {
            return null;
        }

        return new DateTimeModel({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds()
        });
    }

    private isInteger(value: any): value is number {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    }

    public toUTCString(): string {
        if (this.isInteger(this.year) && this.isInteger(this.month) && this.isInteger(this.day)) {
            const date = new Date(Date.UTC(
                this.year,
                this.month - 1,  // Month is 0-indexed in Date constructor
                this.day,
                this.hour || 0,
                this.minute || 0,
                this.second || 0
            ));

            return date.toISOString();
        }

        return null;
    }

    public toLocalString(): string {
        if (this.isInteger(this.year) && this.isInteger(this.month) && this.isInteger(this.day)) {
            const year = this.year.toString().padStart(2, '0');
            const month = this.month.toString().padStart(2, '0');
            const day = this.day.toString().padStart(2, '0');

            const hour = (this.hour || 0).toString().padStart(2, '0');
            const minute = (this.minute || 0).toString().padStart(2, '0');
            const second = (this.second || 0).toString().padStart(2, '0');

            return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        }

        return null;
    }
}

