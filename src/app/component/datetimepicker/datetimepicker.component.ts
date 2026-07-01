import {
  Component,
  OnInit,
  Input,
  forwardRef,
  ViewChild,
  AfterViewInit,
  Injector,
} from '@angular/core';
import {
  NgbTimeStruct,
  NgbDateStruct,
  NgbDateAdapter,
  NgbPopoverConfig,
  NgbPopover,
  NgbDatepicker,
  NgbPopoverModule,
  NgbTimepicker,
} from '@ng-bootstrap/ng-bootstrap';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
  NgControl,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { noop } from 'rxjs';
import { DateTimeModel } from './datetime.model';
import { FeatherModule } from 'angular-feather';

/**
 * Pass-through NgbDateAdapter — identical to ng-bootstrap's default behaviour.
 * Provided on this component so the internal <ngb-datepicker> is ISOLATED from any
 * ancestor screen that registers a custom NgbDateAdapter (most entry screens do).
 * Without this, the ancestor's custom adapter reformats the value emitted on date
 * selection, so onDateChange can't parse it, `datetime` never updates, and the clock
 * / time view stays disabled. This keeps the picker self-contained and unaffected by
 * whatever adapter the host screen uses.
 */
class PassThroughNgbDateAdapter extends NgbDateAdapter<NgbDateStruct> {
  fromModel(value: any): NgbDateStruct | null {
    return value && value.year && value.month
      ? { year: value.year, month: value.month, day: value.day }
      : null;
  }
  toModel(date: NgbDateStruct | null): NgbDateStruct | null {
    return date && date.year && date.month
      ? { year: date.year, month: date.month, day: date.day }
      : null;
  }
}

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
    NgbTimepicker,
  ],
  providers: [
    DatePipe,
    { provide: NgbDateAdapter, useClass: PassThroughNgbDateAdapter },
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateTimePickerComponent),
      multi: true,
    },
  ],
})
export class DateTimePickerComponent
  implements ControlValueAccessor, OnInit, AfterViewInit
{
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
  @Input()
  inputReadonly = false;
  /**
   * When true, past dates are selectable (no minimum date). Default false keeps the
   * existing behaviour (no past dates) for the calendar / meeting screens. Set true
   * for screens like ShipmentMilestone where back-dated entries are valid.
   */
  @Input()
  allowPastDates = false;

  showTimePickerToggle = false;

  datetime: DateTimeModel = new DateTimeModel();
  private firstTimeAssign = true;
  minDate?: NgbDateStruct; // undefined when allowPastDates is true

  @ViewChild(NgbDatepicker)
  private dp: NgbDatepicker;

  @ViewChild(NgbPopover)
  private popover: NgbPopover;
  timePickerContent = 'Select DateTime';

  private onTouched: () => void = noop;
  private onChange: (_: any) => void = noop;

  ngControl: NgControl;

  constructor(
    private config: NgbPopoverConfig,
    private inj: Injector,
  ) {
    config.autoClose = 'outside';
    config.placement = 'auto';
  }

  ngOnInit(): void {
    this.ngControl = this.inj.get(NgControl);
    if (this.allowPastDates) {
      // No minimum — back-dated selections allowed (e.g. ShipmentMilestone).
      this.minDate = undefined;
    } else {
      const now = new Date();
      this.minDate = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        day: now.getDate(),
      };
    }
  }

  ngAfterViewInit(): void {
    this.popover.hidden.subscribe(($event) => {
      this.showTimePickerToggle = false;
    });
  }

  writeValue(newModel: string) {
    if (newModel) {
const parsedDateTime = DateTimeModel.fromUTCString(newModel);
      if (parsedDateTime) {
        this.datetime = Object.assign(this.datetime, parsedDateTime);
        this.dateString = newModel;
      }
    } else {
      this.datetime = new DateTimeModel();
      this.dateString = '';
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
    const dt = DateTimeModel.fromUTCString(value);

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
    if (typeof $event !== 'string') {
      // type guard: ensures it's NgbDateStruct
      $event = `${$event.year}-${String($event.month).padStart(2, '0')}-${String($event.day).padStart(2, '0')}`;
    }

    const date = DateTimeModel.fromUTCString($event);

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
    this.datetime.hour = 0;
    this.datetime.minute = 0;
    this.datetime.second = 0;

    if (this.dp) {
      this.dp.navigateTo({
        year: this.datetime.year,
        month: this.datetime.month,
      });
    }

    this.setDateStringModel();

    setTimeout(() => {
      this.showTimePickerToggle = true; // switch UI to time picker mode
    }, 150);
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
    if (!this.datetime || !this.datetime.year) {
      this.dateString = '';
      this.onChange('');
      return;
    }

    // Create UTC date from component values (NO offset calculation)
    const utcDate = new Date(
      Date.UTC(
        this.datetime.year,
        this.datetime.month - 1, // Month is 0-indexed in Date constructor
        this.datetime.day,
        this.datetime.hour || 0,
        this.datetime.minute || 0,
        this.datetime.second || 0,
      ),
    );

    // Convert to ISO string (same values, UTC format)
    this.dateString = utcDate.toISOString();

    // Notify parent form of change
    this.onChange(this.dateString);
  }

  /**
   * Format datetime for display WITHOUT timezone conversion
   * Shows exactly what user selected (same as timepicker shows)
   */
  getDisplayDateTime(): string {
    if (!this.datetime || !this.datetime.year) {
      return '';
    }

    const year = this.datetime.year;
    const month = this.getMonthName(this.datetime.month);
    const day = String(this.datetime.day).padStart(2, '0');
    const hour = String(this.datetime.hour || 0).padStart(2, '0');
    const minute = String(this.datetime.minute || 0).padStart(2, '0');
    const second = String(this.datetime.second || 0).padStart(2, '0');

    // Convert to 12-hour format if meridian is true
    let displayHour: string | number = this.datetime.hour || 0;
    let meridian = 'AM';

    if (this.meridian) {
      if (displayHour === 0) {
        displayHour = 12;
      } else if (displayHour >= 12) {
        meridian = 'PM';
        if (displayHour > 12) {
          displayHour -= 12;
        }
      }
      displayHour = String(displayHour).padStart(2, '0');
    }

    // Format: "22/Jan/2026 12:00:00 AM"
    return `${day}/${month}/${year} ${displayHour}:${minute}:${second} ${this.meridian ? meridian : ''}`.trim();
  }

  /**
   * Helper to get month name
   */
  private getMonthName(month: number): string {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1] || '';
  }

  // Add this method to your DateTimePickerComponent class
  reset(): void {
    this.datetime = new DateTimeModel();
    this.dateString = '';
    this.onChange('');
    this.onTouched();

    // Also reset the NgbDatepicker if available
    if (this.dp) {
      this.dp.navigateTo(this.minDate);
    }

    this.showTimePickerToggle = false;
  }

  inputBlur($event) {
    this.onTouched();
  }
}
