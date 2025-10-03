import { Component, OnInit, Input, forwardRef, ViewChild, AfterViewInit, Injector } from '@angular/core';
import { NgbTimeStruct, NgbDateStruct, NgbPopoverConfig, NgbPopover, NgbDatepicker, NgbPopoverModule, NgbTimepicker } from '@ng-bootstrap/ng-bootstrap';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NgControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { noop } from 'rxjs';
import { DateTimeModel } from './datetime.model';
import { FeatherModule } from 'angular-feather';
@Component({
  selector: 'app-date-time-picker',
  templateUrl: './datetimepicker.component.html',
  styleUrls: ['./datetimepicker.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPopoverModule,
    FeatherModule,
    NgbDatepicker,
    NgbTimepicker
  ],
  providers: [
    DatePipe,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true
    }
  ]
})
export class DateTimePickerComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @Input()
  dateString: string;
  meridian = true;
  @Input()
  inputDatetimeFormat = 'd/MMM/yyyy h:mm:ss a';
  @Input()
  hourStep = 1;
  @Input()
  minuteStep = 15;
  @Input()
  secondStep = 30;
  @Input()
  seconds = true;

  @Input()
  disabled = false;

  showTimePickerToggle = false;

  datetime: DateTimeModel = new DateTimeModel();
  private firstTimeAssign = true;
  minDate: NgbDateStruct;   // <---- add this line

  @ViewChild(NgbDatepicker)
  private dp: NgbDatepicker;

  @ViewChild(NgbPopover)
  private popover: NgbPopover;
  timePickerContent = "Select DateTime"

  private onTouched: () => void = noop;
  private onChange: (_: any) => void = noop;

  ngControl: NgControl;

  constructor(private config: NgbPopoverConfig, private inj: Injector) {
    config.autoClose = 'outside';
    config.placement = 'auto';
  }

  ngOnInit(): void {
    this.ngControl = this.inj.get(NgControl);
    const now = new Date();
  this.minDate = {
    year:  now.getFullYear(),
    month: now.getMonth() + 1,
    day:   now.getDate()
  };
  }

  ngAfterViewInit(): void {
    this.popover.hidden.subscribe($event => {
      this.showTimePickerToggle = false;
    });
  }

  writeValue(newModel: string) {
    if (newModel) {
      this.datetime = Object.assign(this.datetime, DateTimeModel.fromLocalString(newModel));
      this.dateString = newModel;
      this.setDateStringModel();
    } else {
      this.datetime = new DateTimeModel();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  toggleDateTimeState($event) {
    this.showTimePickerToggle = !this.showTimePickerToggle;
    $event.stopPropagation();
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInputChange($event: any) {
    const value = $event.target.value;
    const dt = DateTimeModel.fromLocalString(value);

    if (dt) {
      this.datetime = dt;
      this.setDateStringModel();
    } else if (value.trim() === '') {
      this.datetime = new DateTimeModel();
      this.dateString = '';
      this.onChange(this.dateString);
    } else {
      this.onChange(value);
    }
  }

  onDateChange($event: string | NgbDateStruct) {
    if (typeof $event !== 'string') {   // type guard: ensures it's NgbDateStruct
      $event = `${$event.year}-${$event.month}-${$event.day}`;
    }

    const date = DateTimeModel.fromLocalString($event);

    if (!date) {
      this.dateString = this.dateString;
      return;
    }

    if (!this.datetime) {
      this.datetime = date;
    }

    this.datetime.year = date.year;
    this.datetime.month = date.month;
    this.datetime.day = date.day;

    if (this.dp) {
      this.dp.navigateTo({ year: this.datetime.year, month: this.datetime.month });
    }

    console.log('test');
    this.setDateStringModel();
  }


  onTimeChange(event: NgbTimeStruct) {
    this.datetime.hour = event.hour;
    this.datetime.minute = event.minute;
    this.datetime.second = event.second;

    this.setDateStringModel();
  }

  // setDateStringModel() {
  //   this.dateString = this.datetime.toString();

  //   if (!this.firstTimeAssign) {
  //     this.onChange(this.dateString);
  //   } else {
  //     // Skip very first assignment to null done by Angular
  //     if (this.dateString !== null) {
  //       this.firstTimeAssign = false;
  //     }
  //   }
  // }


  setDateStringModel() {
  // if time is not set, default to 00:00:00 (12:00 AM)
  if (this.datetime && 
      (this.datetime.hour === null || this.datetime.minute === null || this.datetime.second === null)) {
    this.datetime.hour = 0;     // 12 AM
    this.datetime.minute = 0;
    this.datetime.second = 0;
  }

  this.dateString = this.datetime.toString();

  if (!this.firstTimeAssign) {
    this.onChange(this.dateString);
  } else {
    if (this.dateString !== null) {
      this.firstTimeAssign = false;
    }
  }
}


  inputBlur($event) {
    this.onTouched();
  }
}
