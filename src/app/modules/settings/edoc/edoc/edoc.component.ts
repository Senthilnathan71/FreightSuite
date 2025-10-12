import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Optional, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
@Component({
  selector: 'app-edoc',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule,NgbDatepickerModule,FeatherModule],
  templateUrl: './edoc.component.html',
  styleUrl: './edoc.component.scss',
   providers: [
      { provide: NgbDateAdapter, useClass: CustomDateAdapter },
      { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
      CustomDatePipe
    ],
})
export class EdocComponent {
  @Input() screenName: string = "Edoc";
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: boolean = false;
  @Input() formData: any = null;
  @Output() dataEmitter = new EventEmitter<any>();
  edocform: FormGroup;
  minDate : NgbDateStruct;

  constructor(private fb: FormBuilder, private appSettingService: AppSettingsService, @Optional() public activeModal: NgbActiveModal,) {
    this.initEdocForm();
    this.minDate = this.toNgbDateStruct(new Date())
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes['resetTrigger'] && this.resetTrigger) {
      this.resetForm();
    }
    if (changes['screenName'] && this.screenName) {
      console.log(this.screenName, 'screenName')
    }

    if (changes['dataItems'] && this.dataItems && this.dataItems.length > 0) {
      console.log(this.dataItems, 'dataItems')
    }

    console.log(this.screenName, 'screenName')
  }
  initEdocForm() {
    this.edocform = this.fb.group({
      DocuNo: ['', Validators.required],
      Date: ['', Validators.required],
      file: ['', Validators.required],
      Filename: ['', Validators.required],
      Type: ['', Validators.required],
      ReceivedDate: ['', Validators.required],
      SentDate: ['', Validators.required],
      FollowupRequired: [false],
      FollowupDate: [''],
      FollowupAction: [''],
      Remarks: [''],
      Status: ['', Validators.required],
    });
    this.edocform.get('FollowupRequired')?.valueChanges.subscribe((isChecked) => {
      const dateCtrl = this.edocform.get('FollowupDate');
      const actionCtrl = this.edocform.get('FollowupAction');

      if (isChecked) {
        dateCtrl?.setValidators([Validators.required]);
        actionCtrl?.setValidators([Validators.required]);
      } else {
        dateCtrl?.clearValidators();
        actionCtrl?.clearValidators();
        dateCtrl?.setValue('');
        actionCtrl?.setValue('');
      }

      dateCtrl?.updateValueAndValidity();
      actionCtrl?.updateValueAndValidity();
    });
  }

  onSubmit() {
    // if (this.edocform.invalid) {
    //   this.edocform.markAllAsTouched();
    //   this.appSettingService.showWarning('Please fill all the required fields');
    //   return;
    // }
    const formData = this.edocform.value;

    this.dataEmitter.emit({
      dataItems: [formData],
      formData: this.formData
    });
    console.log(this.edocform.value);
  }

  resetForm() {
    this.edocform.reset();
  }

  modeOfType = [
    { id: '1', name: 'pdf' },
    { id: '2', name: 'xlsx' },
    { id: '3', name: 'json' },
    { id: '4', name: 'text' },
    { id: '5', name: 'docx' },
  ];

  modeOfStatus = [
    { id: '1', name: 'Active' },
    { id: '2', name: 'Suspended' },
  ];

  // closeModal(){
  //   this.activeModal.close();
  // }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  closeTemplate() {
    this.closeModal.emit(true);
  }
}
