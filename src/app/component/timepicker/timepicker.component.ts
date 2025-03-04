import { Component, Injectable } from '@angular/core';
import {
  NgbTimeStruct,
  NgbTimeAdapter,
  NgbTimepickerModule,
} from '@ng-bootstrap/ng-bootstrap';
import { UntypedFormControl, AbstractControl } from '@angular/forms';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';

const pad = (i: number): string => (i < 10 ? `0${i}` : `${i}`);

@Injectable()
export class NgbTimeStringAdapter extends NgbTimeAdapter<string> {
  fromModel(value: string | null): NgbTimeStruct | null {
    if (!value) {
      return null;
    }
    const split = value.split(':');
    return {
      hour: parseInt(split[0], 10),
      minute: parseInt(split[1], 10),
      second: parseInt(split[2], 10),
    };
  }

  toModel(time: NgbTimeStruct | null): string | null {
    return time != null
      ? `${pad(time.hour)}:${pad(time.minute)}:${pad(time.second)}`
      : null;
  }
}

@Component({
  selector: 'app-ngbd-timepicker',
  standalone: true,
  imports: [
    NgbTimepickerModule,
    ReactiveFormsModule,
    FormsModule,
    JsonPipe,
  ],
  templateUrl: './timepicker.component.html',
  providers: [{ provide: NgbTimeAdapter, useClass: NgbTimeStringAdapter }],
})
export class NgbdtimepickerBasicComponent {
  time = { hour: 13, minute: 30 };
  meridian = true;

  // This is for the seconds
  timeSec: NgbTimeStruct = { hour: 13, minute: 30, second: 30 };
  seconds = true;

  // This is for the spinners
  spinners = true;
  toggleSpinners() {
    this.spinners = !this.spinners;
  }

  // This is for the column step
  customtime: NgbTimeStruct = { hour: 13, minute: 30, second: 0 };
  hourStep = 1;
  minuteStep = 15;
  secondStep = 30;

  // last
  time1 = '13:30:00';

  // custom time picker
  customTime: string = '13:30:00';

  // This is for the validation
  // ctrl = new FormControl<NgbTimeStruct | null>(null, (control: FormControl<NgbTimeStruct | null>) => {
  ctrl = new UntypedFormControl('', (control: AbstractControl) => {
    const value = control.value;

    if (!value) {
      return null;
    }

    if (value.hour < 12) {
      return { tooEarly: true };
    }
    if (value.hour > 13) {
      return { tooLate: true };
    }

    return null;
  });

  toggleMeridian() {
    this.meridian = !this.meridian;
  }

  toggleSeconds() {
    this.seconds = !this.seconds;
  }
}
