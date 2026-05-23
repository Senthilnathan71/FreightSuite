import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { FeatherModule } from 'angular-feather';
import { ActivatedRoute, Router } from '@angular/router';
import { LeadService } from '../../Services/lead.service';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { NgbDatepickerModule, NgbDropdownModule, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { MasterService } from 'src/app/modules/master/master.service';
import { DateTimeModel } from 'src/app/component/datetimepicker/datetime.model';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { HasUnsavedChanges } from 'src/app/core/interfaces/has-unsaved-changes.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule,
    NgbDatepickerModule,
    NgSelectModule,
    NgbDropdownModule,
    DateTimePickerComponent,
    SearchableDropdown
  ],
  templateUrl: './meeting.component.html',
  styleUrl: './meeting.component.scss'
})
export class MeetingComponent implements OnInit, OnDestroy, HasUnsavedChanges {
  @ViewChild(DateTimePickerComponent) dateTimePicker!: DateTimePickerComponent;
  meetingForm: FormGroup;
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  PreCustomerMasterSid: number;
  salesPerson: any
  customerByOptions = ['Email', 'Advertisement', 'Website', 'Others'];
  salesPersons: any
  lead: any
  minDate!: any;
  currentCompany: any;
  currentBranch: any;
  userData: any;
  auditLogs: any[] = []; // Stores audit logs
  auditLogModalRef!: NgbModalRef;
  isDirty: boolean = false;
  isSaving: boolean = false;
  private initialFormValue: any = null;
  private destroy$ = new Subject<void>();
  selectedTime = '10 min';
  userLookupConfig = DROPDOWN_CONFIGS.USER;
  meetingDurations = [
  { label: '10 min', value: '10 min' },
  { label: '20 min', value: '20 min' },
  { label: '30 min', value: '30 min' },
  { label: '40 min', value: '40 min' },
  { label: '50 min', value: '50 min' },
  { label: '1 hr', value: '1 hr' }
];

 

  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: ModalService,
    private ngbModal: NgbModal,
    private masterService: MasterService,
  ) { }

  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.userData = this.appSettingService.getDecryptedUserProfile();

    this.initForm();
    this.initialFormValue = this.meetingForm.getRawValue();
    this.subscribeToFormChanges();
    this.route.paramMap.subscribe(params => {
      this.PreCustomerMasterSid = +params.get('PreCustomerMasterSid');
      if (this.PreCustomerMasterSid) {
        this.loadLeadData(this.PreCustomerMasterSid);
      }
    });
    this.loadSalesPerson()
    this.minDate = this.getCurrentDateTime();
  }

  getCurrentDateTime(): string {
  const now = new Date();
  // Pad month, day, hours, minutes for proper 2-digit format
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

  // Method to load the city data
  loadSalesPerson(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllSalesman(CompanyMasterSid).subscribe(
      (resp: any) => {
        console.log(resp, 'SalesPerson')
        this.salesPersons = resp
      });
  }

  // Initialize the Form
  initForm() {
    this.meetingForm = this.fb.group({
      customerName: ['', Validators.required],
      meetingDate: ['', Validators.required],
      meetingType: ['', Validators.required],
      leadAssignTo: ['', Validators.required],
      contactPerson: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      status: ['A', Validators.required],
      customerProfile: ['', Validators.required],
      meetingDuration: ['10 min'],
    });
    this.selectedTime = '10 min';


    this.meetingForm.get('customerName')?.disable();
    this.meetingForm.get('contactPerson')?.disable();
    this.meetingForm.get('phone')?.disable();
    this.meetingForm.get('meetingDuration').valueChanges.subscribe((value) => {
      console.log(value,"DropDown Time");
    })
    this.meetingForm.get('meetingDate').valueChanges.subscribe((value) => {
      console.log(value);
    })
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    this.meetingForm.controls['status'].disable();
    return this.meetingForm.controls;
  }

changeTime(time: string) {
  this.meetingForm.get('meetingDuration')?.setValue(time);
  this.selectedTime = time ; // update button display
}


  // Handle Form Submission
  onSubmit() {
    if (this.isSaving) return;

    const raw = this.meetingForm.getRawValue();
    if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
      this.appSettingService.showWarning('No changes to save');
      this.meetingForm.markAsUntouched();
      return;
    }

    this.meetingForm.get('customerName')?.enable();
    this.meetingForm.get('contactPerson')?.enable();
    this.meetingForm.get('phone')?.enable();
    this.meetingForm.get('status')?.enable();
   
    const meetingDateStr = this.meetingForm.value.meetingDate;
    // const meetingDate = new Date(meetingDateStr);
    const meetingDate = meetingDateStr;
    const timeDropdown = this.meetingForm.value.meetingDuration;
    // console.log(meetingDate.getTime(),'meetingDate.getTime')    
    // if (isNaN(meetingDate.getTime())) {
    //   this.appSettingService.showError("Invalid meeting date");
    //   return;
    // }
    const payload = {
      ...this.meetingForm.value,
      meetingDuration:timeDropdown,
      meetingDate: meetingDate,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      createdBy: this.userData?.userEmail,
      LeadOrCustomer: 'L',
      PreCustomerMasterSid: this.PreCustomerMasterSid,
      status: this.meetingForm.get('status')?.value === "Active" ? "A" : "D"
    };
    this.btnDisable = true;
    this.isSaving = true;
    console.log(payload, "PAYLOAD")
    this.leadService.createPreCustomerMeeting(payload).subscribe({
      next: (resp: any) => {
        if (resp.data && resp.status) {
          // this.appSettingService.showSuccess(resp.message);
          this.appSettingService.showSuccess(resp.message);
          this.btnDisable = false;
          this.isSaving = false;
          this.meetingForm.patchValue(resp.data);
          this.initialFormValue = this.meetingForm.getRawValue();
          this.isDirty = false;
          this.router.navigate([`/crm/lead-schedule-pending`]);

        } else {
          // this.appSettingService.showError(resp.message);
          this.appSettingService.showError(resp.message);
          this.isSaving = false;
          this.btnDisable = false;
        }
      },
      error: () => {
        this.isSaving = false;
        this.btnDisable = false;
      }
    })
    console.log('Creating Lead:', payload);
  }



  // Fetch lead data and patch the form
  loadLeadData(leadId: number) {
    this.leadService.getLeadById(leadId).subscribe(
      (leadData) => {
        console.log(leadData, 'leadData')
        this.lead = leadData
        this.lead.status = this.lead.status === "A" ? "Active" : "Suspend";
        if (this.lead) {
          this.meetingForm.patchValue({
            customerName: this.lead.preCustomerName || '',
            contactPerson: this.lead.contactPerson || '',
            phone: this.lead.phone || '',
            status: this.lead.status || '',
          });
          this.initialFormValue = this.meetingForm.getRawValue();
          this.isDirty = false;
        }
        // this.meetingForm.patchValue(leadData);
      }
    );
  }

  // Handle city selection change
  onSalesPersonChange(event: any) {
    const selectedSalesPersonId = event.target.value;
    const selectedPerson = this.salesPerson.find((person) => person.UserMasterSid == selectedSalesPersonId);

    if (selectedSalesPersonId) {
      this.meetingForm.patchValue({
        UserMasterSid: selectedPerson.UserMasterSid
      });
    }
  }

   resetForm(): void {
    // Reset the DateTimePickerComponent first
    if (this.dateTimePicker) {
      this.dateTimePicker.reset();
    }
    
    // Reset form values
    const originalValues = {
      customerName: this.lead?.preCustomerName || '',
      contactPerson: this.lead?.contactPerson || '',
      phone: this.lead?.phone || '',
      status: this.lead?.status || 'A',
      meetingDate: '',
      meetingType: '',
      leadAssignTo: '',
      customerProfile: '',
      meetingDuration: '10 min'
    };
    
    // Reset the form
    this.meetingForm.reset(originalValues);
    
    // Force reset the meetingDate control
    this.meetingForm.get('meetingDate')?.setValue('');
    
    // Reset selected time
    this.selectedTime = '10 min';
    
    // Re-disable fields
    this.meetingForm.get('customerName')?.disable();
    this.meetingForm.get('contactPerson')?.disable();
    this.meetingForm.get('phone')?.disable();
    this.meetingForm.get('status')?.disable();
    
    this.btnDisable = false;
    this.errorMessage = '';
  }

  goBack() {
    this.router.navigate(['/crm/lead-schedule-pending']);
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      $event.preventDefault();
      $event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    }
  }

  hasUnsavedChanges(): boolean {
    const hasChanges = !this.deepEqual(this.initialFormValue, this.meetingForm?.getRawValue());
    this.isDirty = hasChanges;
    return hasChanges;
  }

  async saveChanges(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isSaving) {
        resolve(false);
        return;
      }

      const raw = this.meetingForm.getRawValue();
      if (this.deepEqual(raw, this.initialFormValue) && !this.isDirty) {
        this.appSettingService.showWarning('No changes to save');
        this.meetingForm.markAsUntouched();
        resolve(true);
        return;
      }

      if (this.meetingForm.invalid) {
        this.meetingForm.markAllAsTouched();
        this.appSettingService.showError('Please fill all the required fields.');
        resolve(false);
        return;
      }

      this.meetingForm.get('customerName')?.enable();
      this.meetingForm.get('contactPerson')?.enable();
      this.meetingForm.get('phone')?.enable();
      this.meetingForm.get('status')?.enable();

      const meetingDateStr = this.meetingForm.value.meetingDate;
      const meetingDate = meetingDateStr;
      const timeDropdown = this.meetingForm.value.meetingDuration;
      const payload = {
        ...this.meetingForm.value,
        meetingDuration: timeDropdown,
        meetingDate: meetingDate,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
        BranchMasterSid: this.currentBranch?.BranchMasterSid,
        createdBy: this.userData?.userEmail,
        LeadOrCustomer: 'L',
        PreCustomerMasterSid: this.PreCustomerMasterSid,
        status: this.meetingForm.get('status')?.value === "Active" ? "A" : "D"
      };

      this.btnDisable = true;
      this.isSaving = true;
      this.leadService.createPreCustomerMeeting(payload).subscribe({
        next: (resp: any) => {
          this.isSaving = false;
          this.btnDisable = false;
          if (resp.data && resp.status) {
            this.isDirty = false;
            this.meetingForm.patchValue(resp.data);
            this.initialFormValue = this.meetingForm.getRawValue();
            resolve(true);
          } else {
            this.appSettingService.showError(resp.message);
            resolve(false);
          }
        },
        error: () => {
          this.isSaving = false;
          this.btnDisable = false;
          resolve(false);
        }
      });
    });
  }

  private subscribeToFormChanges(): void {
    this.meetingForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isDirty = !this.deepEqual(this.initialFormValue, this.meetingForm.getRawValue());
      });
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(+value)) {
      return Number(value);
    }
    if (typeof value === 'number') {
      return Number(value.toFixed(6));
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.normalizeValue(v));
    }
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc: any, key) => {
          acc[key] = this.normalizeValue(value[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    const normalizedObj1 = this.normalizeValue(obj1);
    const normalizedObj2 = this.normalizeValue(obj2);
    return JSON.stringify(normalizedObj1) === JSON.stringify(normalizedObj2);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
