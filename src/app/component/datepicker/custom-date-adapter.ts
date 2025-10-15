import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class CustomDateAdapter extends NgbDateAdapter<Date> {
  fromModel(date: any): NgbDateStruct | null {
    if (!date) return null;

    // ✅ Handle string values like "2025-10-14" or "2025-10-14T00:00:00"
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        console.warn('Invalid date string passed to CustomDateAdapter.fromModel:', date);
        return null;
      }
      return {
        year: parsed.getFullYear(),
        month: parsed.getMonth() + 1,
        day: parsed.getDate(),
      };
    }

    // ✅ Handle valid Date objects
    if (date instanceof Date && !isNaN(date.getTime())) {
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
    }

    // 🚨 Anything else (like number, object, etc.)
    console.warn('Unexpected value passed to CustomDateAdapter.fromModel:', date);
    return null;
  }

  toModel(date: NgbDateStruct | null): Date | null {
    if (!date) return null;
    return new Date(date.year, date.month - 1, date.day);
  }
}
