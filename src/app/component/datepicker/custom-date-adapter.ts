import { Injectable } from '@angular/core';
import { NgbDateAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Injectable()
export class CustomDateAdapter extends NgbDateAdapter<Date> {
  fromModel(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  toModel(date: NgbDateStruct | null): Date | null {
    if (!date) return null;
    return new Date(date.year, date.month - 1, date.day);
  }
}
