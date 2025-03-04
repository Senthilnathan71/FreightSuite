import { Component } from '@angular/core';
import {
  NgbDateStruct,
  NgbCalendar,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-datepicker-simple',
  templateUrl: './simpledatepicker.component.html',
  imports: [NgbDatepickerModule, FormsModule, JsonPipe],
  standalone: true,
})
export class SimpleDatepickerBasic {
  model!: NgbDateStruct;
  date!: { year: number; month: number };

  constructor(private calendar: NgbCalendar) {}

  selectToday() {
    this.model = this.calendar.getToday();
  }
}
