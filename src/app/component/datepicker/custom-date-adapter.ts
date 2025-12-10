// import { Injectable } from '@angular/core';
// import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

// @Injectable()
// export class CustomDateAdapter extends NgbDateAdapter<Date> {
//   fromModel(date: any): NgbDateStruct | null {
//     if (!date) return null;

//     // ✅ Handle string values like "2025-10-14" or "2025-10-14T00:00:00"
//     if (typeof date === 'string') {
//       const parsed = new Date(date);
//       if (isNaN(parsed.getTime())) {
//         console.warn('Invalid date string passed to CustomDateAdapter.fromModel:', date);
//         return null;
//       }
//       return {
//         year: parsed.getFullYear(),
//         month: parsed.getMonth() + 1,
//         day: parsed.getDate(),
//       };
//     }

//     // ✅ Handle valid Date objects
//     if (date instanceof Date && !isNaN(date.getTime())) {
//       return {
//         year: date.getFullYear(),
//         month: date.getMonth() + 1,
//         day: date.getDate(),
//       };
//     }

//     // 🚨 Anything else (like number, object, etc.)
//     console.warn('Unexpected value passed to CustomDateAdapter.fromModel:', date);
//     return null;
//   }

//   toModel(date: NgbDateStruct | null): Date | null {
//     if (!date) return null;
//     return new Date(date.year, date.month - 1, date.day);
//   }
// }



import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class CustomDateAdapter extends NgbDateAdapter<Date> {
  fromModel(date: any): NgbDateStruct | null {
    // console.log('🔵 CustomDateAdapter.fromModel called with:', date, 'Type:', typeof date);

    if (!date) return null;

    // ✅ If it's already an NgbDateStruct, return it as-is
    if (this.isNgbDateStruct(date)) {
      // console.log('✅ Already NgbDateStruct:', date);
      return date;
    }

    // ✅ Handle string values like "2025-10-14T00:00:00.000Z"
    if (typeof date === 'string') {
      // Parse ISO date strings manually to avoid timezone issues
      const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        const result = {
          year: parseInt(dateMatch[1], 10),
          month: parseInt(dateMatch[2], 10),
          day: parseInt(dateMatch[3], 10),
        };
        // console.log('✅ Parsed string to NgbDateStruct:', result);
        return result;
      }

      // Fallback to Date parsing with UTC
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        console.warn('⚠️ Invalid date string:', date);
        return null;
      }
      const result = {
        year: parsed.getUTCFullYear(),
        month: parsed.getUTCMonth() + 1,
        day: parsed.getUTCDate(),
      };
      // console.log('✅ Parsed string via Date to NgbDateStruct:', result);
      return result;
    }

    // ✅ Handle valid Date objects (use UTC to avoid timezone issues)
    if (date instanceof Date && !isNaN(date.getTime())) {
      const result = {
        year: date.getUTCFullYear(),
        month: date.getUTCMonth() + 1,
        day: date.getUTCDate(),
      };
      // console.log('✅ Converted Date to NgbDateStruct:', result);
      return result;
    }

    // 🚨 Anything else
    console.warn('⚠️ Unexpected value passed to fromModel:', date);
    return null;
  }

  toModel(date: NgbDateStruct | null): Date | null {
    // console.log('🟢 CustomDateAdapter.toModel called with:', date);
    if (!date) return null;
    
    // Return UTC date to avoid timezone issues
    const result = new Date(Date.UTC(date.year, date.month - 1, date.day));
    // console.log('✅ Converted NgbDateStruct to Date:', result);
    return result;
  }

  private isNgbDateStruct(obj: any): obj is NgbDateStruct {
    return obj && typeof obj === 'object' && 
           'year' in obj && 'month' in obj && 'day' in obj &&
           typeof obj.year === 'number' && 
           typeof obj.month === 'number' && 
           typeof obj.day === 'number';
  }
}