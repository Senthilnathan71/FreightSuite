import { Component, Injectable } from '@angular/core';
import {
  NgbCalendar,
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { SimpleDatepickerBasic } from './simpledatepicker.component';
import { Custommonth } from './customonth.component';
import { FeatherModule } from 'angular-feather';

@Component({
  selector: 'app-datepicker-basic',
  templateUrl: './datepicker.component.html',
  standalone: true,
  imports: [
    NgbDatepickerModule,
    FormsModule,
    SimpleDatepickerBasic,
    Custommonth,
    FeatherModule,
  ],
})
export class NgbdDatepickerBasicComponent {
  model: NgbDateStruct;
  disabled = true;
  today = this.calendar.getToday();

  constructor(private calendar: NgbCalendar) {
    this.model = calendar.getToday();
  }
}
