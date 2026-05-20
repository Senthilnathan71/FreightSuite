import { AppSettingsService } from './../../../core/services/app-settings.service';
import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, OnInit, AfterViewInit } from '@angular/core';
import { startOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours, } from 'date-fns';
import { Subject } from 'rxjs';
import { NgbActiveModal, NgbDatepickerModule, NgbModal, NgbModalRef, } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarView, } from 'angular-calendar';
import { CalendarModule } from 'angular-calendar';

import { AbstractControl, FormBuilder, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlatpickrModule } from 'angularx-flatpickr';

import { AppService } from 'src/app/service/app.service';
import { FeatherModule } from 'angular-feather';
import { LeadService } from '../Services/lead.service';
import { forkJoin } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core'; // Import ChangeDetectorRef
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { EmailEntryComponent } from '../../settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';
import { MenuPermissionService } from 'src/app/core/services/menu-permission.service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { UnsavedChangesAction, UnsavedChangesDialogComponent } from 'src/app/shared/components/unsaved-changes-dialog/unsaved-changes-dialog.component';
import { AuditLogComponent } from '../../operation/audit-log/audit-log.component';
import { ElementStateGuardDirective } from 'src/app/core/Directives/element-state-guard.directive';


const colors: any = {
  red: {
    primary: '#ff5c6c',
    secondary: '#F9D3D3',
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF',
  },
  yellow: {
    primary: '#24d2b5',
    secondary: '#FFEED4',
  },
};

@Component({
  selector: 'app-fullcalendar',
  standalone: true,
  imports: [CalendarModule, FormsModule, ReactiveFormsModule, CommonModule, FlatpickrModule, FeatherModule, PreventMultiClickDirective, NgSelectModule, NgbDatepickerModule, DateTimePickerComponent, SearchableDropdown, ElementStateGuardDirective],

  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fullcalendar.component.html',
  styleUrls: ['./fullcalendar.component.scss'],
})
export class FullcalendarComponent implements OnInit, AfterViewInit {
  @ViewChild('customerCreatedModal', { static: true }) customerCreatedModal!: TemplateRef<any>;
  @ViewChild('modalContent', { static: true }) modalContent!: TemplateRef<any>;
  @ViewChild('modalContentAdd', { static: true })
  modalContentAdd!: TemplateRef<any>;

  @ViewChild('modalContentAddForm', { static: true })
  modalContentAddForm!: TemplateRef<any>;
  view: CalendarView = CalendarView.Week;
  PreCustomerMeetingSid: any
  CalendarView = CalendarView;
  // Declare modalRef with type NgbModalRef
  modalRef!: NgbModalRef;
  modalAddFormRef!: NgbModalRef;
  calendarEventData: any;

  meetingDurations = [
    { label: '10 min', value: '10 min' },
    { label: '20 min', value: '20 min' },
    { label: '30 min', value: '30 min' },
    { label: '40 min', value: '40 min' },
    { label: '50 min', value: '50 min' },
    { label: '1 hr', value: '1 hr' }
  ];

  userData: any;
  viewDate: Date = new Date();
  customers: any
  isMobile: boolean = false;
  meetingForm: FormGroup;
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
  userLookupConfig = DROPDOWN_CONFIGS.USER;
  /*/////////////////////////////////////
  Event action buttons
  ////////////////////////////////////*/
  actions: CalendarEventAction[] = [
    {
      label:
        '<span class="badge bg-info ms-1"><i class="ti-pencil"></i></span>',
      a11yLabel: 'Edit',
      onClick: ({ event }: { event: CalendarEvent }): void => {
        this.handleEvent('Edit', event);
      },
    },
    // {
    //   label:
    //     '<span class="badge bg-danger ms-1"><i class="ti-trash"></i></span>',
    //   a11yLabel: 'Delete',
    //   onClick: ({ event }: { event: CalendarEvent }): void => {
    //     this.events = this.events.filter((iEvent) => iEvent !== event);
    //     this.handleEvent('Deleted', event);
    //   },
    // },
  ];

  refresh = new Subject<void>();
  preCustomerMeetingData: any
  /*/////////////////////////////////////
  Default Events added
  ////////////////////////////////////*/
  events: CalendarEvent[] = []
  //  | any[] = [
  //   {
  //     start: subDays(startOfDay(new Date()), 1),
  //     end: addDays(new Date(), 1),
  //     title: 'A 3 day event',
  //     color: colors.red,
  //     actions: this.actions,
  //     allDay: true,
  //     resizable: {
  //       beforeStart: true,
  //       afterEnd: true,
  //     },
  //     draggable: true,
  //   },
  //   {
  //     start: startOfDay(new Date()),
  //     title: 'An event with no end date',
  //     color: colors.yellow,
  //     actions: this.actions,
  //   },
  //   {
  //     start: subDays(endOfMonth(new Date()), 3),
  //     end: addDays(endOfMonth(new Date()), 3),
  //     title: 'A long event that spans 2 months',
  //     color: colors.blue,
  //     allDay: true,
  //   },
  //   {
  //     start: addHours(startOfDay(new Date()), 2),
  //     end: addHours(new Date(), 2),
  //     title: 'A draggable and resizable event',
  //     color: colors.yellow,
  //     actions: this.actions,
  //     resizable: {
  //       beforeStart: true,
  //       afterEnd: true,
  //     },
  //     draggable: true,
  //   },
  // ];

  activeDayIsOpen: boolean = true;
  salesPersons: any
  modalData!: {
    action: string;
    event: CalendarEvent | any;
  };
  currentMenuId: number;
  TandCList: any;
  currentCompany: any;
  currentBranch: any;
  leadList: any[] = [];
  createdCustomerId: number | null = null;
  isMeetingDirty: boolean = false;
  isMeetingSaving: boolean = false;
  private initialMeetingFormValue: any = null;

  private pendingScheduleLead: any = null;

  constructor(private modalService: ModalService, private cdr: ChangeDetectorRef, private appSettingService: AppSettingsService, private fb: FormBuilder, private leadService: LeadService, private modal: NgbModal, private appService: AppService, private ngbModal: NgbModal, public mps: MenuPermissionService, private router: Router) { }

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    this.isMobile = this.appService.getDevice()
    this.mps.init().subscribe();
    this.loadCustomers()
    this.loadLeads();
    this.loadSalesPersons()
    this.initForm();
    console.log('Default meetingStatus:', this.meetingForm.get('meetingStatus')?.value);
    this.getMeetingDates()
    this.minDate = this.getCurrentDateTime();

    // Check if navigated from sales dashboard with a lead to schedule
    const navState = history.state;
    if (navState?.scheduleLead) {
      this.pendingScheduleLead = navState.scheduleLead;
      // Clear the state so a refresh won't re-trigger the modal
      history.replaceState({ ...navState, scheduleLead: undefined }, '');
    }
  }

  ngAfterViewInit(): void {
    if (this.pendingScheduleLead) {
      const lead = this.pendingScheduleLead;
      this.pendingScheduleLead = null;

      // Use setTimeout to allow the view to fully initialize
      setTimeout(() => {
        this.addEvent();

        // Pre-fill the form with lead data
        this.meetingForm.patchValue({
          LeadOrCustomer: 'L',
          PreCustomerMasterSid: lead.PreCustomerMasterSid,
          leadAssignTo: this.userData?.UserMasterSid || null,
        });
        ['LeadOrCustomer', 'PreCustomerMasterSid'].forEach(key => {
          this.meetingForm.get(key)?.disable();
        });
        this.cdr.detectChanges();
      });
    }
  }


  getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format as 'YYYY-MM-DDTHH:mm'
  }

  private getMeetingUserContext(): { userId: number; userTypeCode: string } {
    const userProfile = this.appSettingService.getDecryptedUserProfile() || {};
    const userFromStream = this.appSettingService.userSettingSource.value || {};

    const userId = Number(
      userProfile?.UserMasterSid
      || userProfile?.userMasterSid
      || userProfile?.UserSid
      || userProfile?.userSid
      || userProfile?.userMaster?.UserMasterSid
      || userProfile?.userMaster?.userMasterSid
      || userFromStream?.UserMasterSid
      || userFromStream?.userMasterSid
      || userFromStream?.UserSid
      || userFromStream?.userSid
      || 0
    );

    const userTypeCode = String(
      userProfile?.userType?.code
      || userProfile?.userMaster?.userType?.code
      || userFromStream?.userType?.code
      || ''
    );

    return { userId, userTypeCode };
  }



  /*/////////////////////////////////////
  On Day Click
  ////////////////////////////////////*/
  dayClicked({ date, events }: { date: Date; events: CalendarEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
      }
      this.viewDate = date;
    }
  }

  eventTimesChanged({
    event,
    newStart,
    newEnd,
  }: CalendarEventTimesChangedEvent): void {
    this.events = this.events.map((iEvent) => {
      if (iEvent === event) {
        return {
          ...event,
          start: newStart,
          end: newEnd,
        };
      }
      return iEvent;
    });
    this.handleEvent('Dropped or resized', event);
  }

  handleEvent(action: string, event: CalendarEvent): void {
    if(!this.mps.can('view')){
      this.appSettingService.showWarning("You do not have permission to view meetings.");
      return;
    }
    this.initForm();
    console.log("Update Permission", this.mps.can('update'))
    this.modalData = { event, action };
    this.PreCustomerMeetingSid = event.id
    // console.log(this.PreCustomerMeetingSid)
    if (event.id) {
      this.loadPreCustomerMeetingData(event.id)
    }
    // this.modal.open(this.modalContent, { size: 'lg' });
    // this.modal.open(this.modalContentAdd, { size: 'lg' })
    this.modalRef = this.modal.open(this.modalContentAdd, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      beforeDismiss: () => this.canCloseMeetingModal()
    });
    // Ensure edit mode patches values and disables fields
    this.meetingForm.get('customerName').disable();
    // this.meetingForm.get('meetingDate').disable();
    this.meetingForm.get('meetingType').disable();
    this.meetingForm.get('leadAssignTo').disable();
  }

  loadCustomers(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllCustomers(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.customers = resp
      });
  }

  loadLeads() {
    const filterOption = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid
    }
    this.leadService.fetchAllLeads(filterOption).subscribe(
      (resp: any) => {
        this.leadList = resp.data
      });
  }

  loadSalesPersons() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllSalesman(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.salesPersons = resp
      });
  }

  /*/////////////////////////////////////
  Add Event
  ////////////////////////////////////*/
  addEvent(): void {

    // Reset the form completely for new meeting entry
    this.meetingForm.reset({
      LeadOrCustomer: 'L',
      followUp: false,
      meetingStatus: 'Scheduled'
    });

    // Ensure the followUp checkbox has a default false value to prevent undefined state
    this.meetingForm.patchValue({ followUp: false });

    // Open new meeting modal
    this.setMeetingFormInitialValue();
    this.modalAddFormRef = this.modal.open(this.modalContentAddForm, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      beforeDismiss: () => this.canCloseMeetingModal()
    });

    // Ensure form fields are enabled for new entry
    this.meetingForm.get('customerName').enable();
    this.meetingForm.get('meetingDate').enable();
    this.meetingForm.get('meetingType').enable();
    this.meetingForm.get('leadAssignTo').enable();
  }

  /*/////////////////////////////////////
  Delete Event
  ////////////////////////////////////*/
  deleteEvent(eventToDelete: CalendarEvent) {
    this.events = this.events.filter((event) => event !== eventToDelete);
  }

  setView(view: CalendarView) {
    console.log(view)
    this.view = view;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }


  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }

  private updateFollowUpValidators(): void {
  const isFollowUp = this.meetingForm.get('followUp')?.value === true;

  const followUpDateCtrl = this.meetingForm.get('followUpDate');
  const followUpNoteCtrl = this.meetingForm.get('followUpNote');

  if (isFollowUp) {
    followUpDateCtrl?.setValidators([Validators.required]);
    followUpNoteCtrl?.setValidators([Validators.required]);
  } else {
    followUpDateCtrl?.clearValidators();
    followUpNoteCtrl?.clearValidators();

    followUpDateCtrl?.setErrors(null);
    followUpNoteCtrl?.setErrors(null);

    followUpDateCtrl?.reset(null, { emitEvent: false });
    followUpNoteCtrl?.reset('', { emitEvent: false });
  }

  followUpDateCtrl?.updateValueAndValidity({ emitEvent: false });
  followUpNoteCtrl?.updateValueAndValidity({ emitEvent: false });
}


  initForm() {
  this.meetingForm = this.fb.group({
    LeadOrCustomer: ["L", Validators.required],
    customerName: [''],
    CustomerMasterSid: [null],
    PreCustomerMasterSid: [''],
    meetingDate: ['', Validators.required],
    followUpDate: [''],
    followUp: [false],
    meetingType: ['', Validators.required],
    leadAssignTo: ['', Validators.required],
    meetingNote: ['', [Validators.required]],
    meetingStatus: ['Scheduled', Validators.required],
    followUpNote: [''],
    meetingDuration: ['10 min', Validators.required]
  });

  this.meetingForm.get('LeadOrCustomer')?.valueChanges.subscribe(value => {
    const preCustomer = this.meetingForm.get('PreCustomerMasterSid');
    const customer = this.meetingForm.get('CustomerMasterSid');

    if (value === 'L') {
      preCustomer?.setValidators([Validators.required]);
      customer?.clearValidators();
      customer?.setValue(null);
    } else if (value === 'C') {
      customer?.setValidators([Validators.required]);
      preCustomer?.clearValidators();
      preCustomer?.setValue(null);
    }

    preCustomer?.updateValueAndValidity();
    customer?.updateValueAndValidity();
  });
  // Meeting note validation
  this.meetingForm.get('meetingStatus')?.valueChanges.subscribe(() => {
    this.meetingForm.get('meetingNote')?.updateValueAndValidity();
  });

  // FollowUpDate validation
  this.meetingForm.get('followUp')?.valueChanges.subscribe(() => {
  this.updateFollowUpValidators();
});
  this.meetingForm.get('LeadOrCustomer')?.setValue(
    this.meetingForm.get('LeadOrCustomer')?.value
  );

  this.meetingForm.valueChanges.subscribe(() => {
    if (this.initialMeetingFormValue === null) return;
    this.isMeetingDirty = !this.deepEqual(
      this.initialMeetingFormValue,
      this.meetingForm.getRawValue()
    );
  });
}
  private meetingNoteValidator(control: AbstractControl) {
  if (!control.parent) return null;

  const status = control.parent.get('meetingStatus')?.value;

  if (status === 'on hold' && !control.value) {
    return { required: true };
  }

  return null;
}


  toggleFollowUp(event: Event): void {
  const isChecked = (event.target as HTMLInputElement).checked;
  this.meetingForm.get('followUp')?.setValue(isChecked);
}


  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.meetingForm.controls;
  }

  minDate: string = '';

  onSubmit(data: NgForm) {
    this.events = [
      ...this.events,
      {
        title: data.value.title,
        start: data.value.startDate,
        end: data.value.endDate,
        color: data.value.color,
        actions: this.actions,
        allDay: true,
        resizable: {
          beforeStart: true,
          afterEnd: true,
        },
        draggable: true,
      },
    ];
    this.modal.dismissAll();
  }

  // private formatDateTime(date: string | Date): string | null {
  //   if (!date) return null;
  //   const dt = new Date(date);

  //   const day = dt.getDate();
  //   const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  //   const month = monthNames[dt.getMonth()];
  //   const year = dt.getFullYear();

  //   let hours = dt.getHours();
  //   const minutes = dt.getMinutes().toString().padStart(2, '0');
  //   const seconds = dt.getSeconds().toString().padStart(2, '0');
  //   const ampm = hours >= 12 ? 'PM' : 'AM';
  //   hours = hours % 12 || 12; // Convert 0 to 12-hour format

  //   return `${day}/${month}/${year} ${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  // }

  getMeetingDates() {
    // first clear events
    this.events = [];

    const userContext = this.getMeetingUserContext();
    const meetingScopePayload = {
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      userTypeCode: userContext.userTypeCode,
      userId: userContext.userId
    };

    this.leadService.getAllPreCustomerMeetings(meetingScopePayload).subscribe((meetingRes: any) => {
      let meetingEvents: any[] = [];

      if (meetingRes.status && meetingRes.data.length) {
        meetingEvents = meetingRes.data
          .map((meeting: any) => {
            const hasFollowUp = !!meeting.followUpDate;
            const isLead = meeting.LeadOrCustomer === "L";
            const name = isLead
              ? meeting?.preCustomerMaster?.preCustomerName
              : meeting?.customerMaster?.CustomerName || "Unknown";
            const durationMin = this.parseDuration(meeting.meetingDuration);
            return {
              start: this.convertUTCToLocal(meeting.meetingDate),
              end: new Date(this.convertUTCToLocal(meeting.meetingDate).getTime() + durationMin * 60000),// add minutes
              title: `Meeting with - ${name}`,
              id: meeting.PreCustomerMeetingSid,
              color: { primary: "#33cc33", secondary: "#ccffcc" }
            };
          });
      }

      this.leadService
        .getFollowUp(
          this.currentCompany?.CompanyMasterSid,
          this.currentBranch?.BranchMasterSid
        )
        .subscribe((followRes: any) => {
          let followUpEvents: any[] = [];

          if (followRes.status && followRes.data.length) {
            followUpEvents = followRes.data
              .map((meeting: any) => {
                const meetingData = meeting.preCustomerMeeting;
                const isCustomer = meetingData.LeadOrCustomer === "C";

                const person = isCustomer
                  ? meetingData.customerMaster?.CustomerName
                  : meetingData.preCustomerMaster?.preCustomerName;

                return {
                  start: this.convertUTCToLocal(meetingData.followUpDate),
                  title: `Follow up meeting with - ${person}`,
                  id: meeting.PreCustomerMeetingSid,
                  color: { primary: "#ff5733", secondary: "#ffcccb" }
                };
              });
          }

          // ✅ Merge both meetings + followups
          const mergedEvents = [...meetingEvents, ...followUpEvents];

// remove duplicates
const uniqueEvents = new Map();

mergedEvents.forEach(event => {
  const key = event.id + '_' + event.start;
  uniqueEvents.set(key, event);
});

this.events = Array.from(uniqueEvents.values());

this.refresh.next();

          this.refresh.next(); // refresh UI
          console.log("Combined Events:", this.events);

          // 👉 if you need to send to backend


        });
    });
  }


  selectedCustomerName: any;


  // onCustomerChange(event: Event): void {
  //   const selectedCustomerName = (event.target as HTMLSelectElement).value;
  //   this.meetingForm.get('customerName')?.setValue(selectedCustomerName);

  //   // Find the selected customer object
  //   const selectedCustomer = this.customers.find(cust => cust.CustomerName === selectedCustomerName);

  //   // Set PreCustomerMeetingSid if found
  //   if (selectedCustomer) {
  //     this.meetingForm.get('PreCustomerMeetingid')?.setValue(selectedCustomer.PreCustomerMasterSid);
  //   } else {
  //     this.meetingForm.get('PreCustomerMeetingid')?.setValue(null); // Reset if no match
  //   }
  // }

  // onPreCustomerChange(event:any){
  //   const selectedLeadId = (event.target as HTMLSelectElement).value;

  //   const selectedLead = this.leadList.find(lead => lead.PreCustomerMasterSid == selectedLeadId);

  //   if (selectedLead) {
  //     this.meetingForm.get('PreCustomerMasterSid')?.setValue(selectedLead.PreCustomerMasterSid);
  //   } else {
  //     this.meetingForm.get('PreCustomerMasterSid')?.setValue(null);
  //   }
  // }



  onAddMeeting() {
      if (this.isMeetingSaving) return;
      if (!this.isMeetingDirty) {
    this.appSettingService.showWarning('No changes to save.');
    return;
  }
      if (this.meetingForm.invalid) {
    // Mark all fields as touched to show validation errors
    this.meetingForm.markAllAsTouched();  
    this.appSettingService.showError('Please fill all required fields');
      console.log('form',this.meetingForm.value)
    return;
  }
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];

    console.log('Current Company:', this.currentCompany);
    console.log('Current Branch:', this.currentBranch);
    console.log('Form Values:', this.meetingForm.value);
    const meetingDateStr = this.meetingForm.value.meetingDate;
    // const meetingDate = new Date(meetingDateStr);
    const meetingDuration = this.meetingForm.value.meetingDuration;
    // Convert followUpDate in same format as meetingDate

    const payload = {
      ...this.meetingForm.getRawValue(),
      meetingDate: meetingDateStr,
      followUpDate: this.meetingForm.getRawValue().followUpDate,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      userEmail: userEmail,
      meetingDuration: meetingDuration,
    };

    console.log('Final Payload:', payload);


    this.leadService.createPreCustomerMeeting(payload).subscribe(
      resp => {
        if (resp.data && resp.status) {
          this.modalService.openSuccessModal(resp.message);
          this.btnDisable = false;
          this.isMeetingSaving = false;
          this.meetingForm.patchValue(resp.data);
          this.setMeetingFormInitialValue();
          this.modalAddFormRef.close();
          this.refreshComponent();
        } else {
          this.btnDisable = false;
          this.isMeetingSaving = false;
          this.modalService.openErrorModal(resp.message);
        }
      },
      error => {
        this.btnDisable = false;
        this.isMeetingSaving = false;
        this.modalService.openErrorModal('Error creating meeting: ' + error.message);
      }
    );
    this.isMeetingSaving = true;
    this.btnDisable = false;
  }
  // Handle Form Submission
  onEditMeeting() {
  if (this.isMeetingSaving) return;
  if (!this.isMeetingDirty) {
    this.appSettingService.showWarning('No changes to save.');
    return;
  }
  this.updateFollowUpValidators();
  
  if (this.meetingForm.invalid) {
    this.meetingForm.markAllAsTouched();
    this.appSettingService.showError('Please fill all required fields');
    return;
  }

  if (this.meetingForm.get('meetingStatus')?.value === 'on hold' &&
      !this.meetingForm.get('meetingNote')?.value) {
    this.meetingForm.get('meetingNote')?.markAsTouched();
    this.appSettingService.showError("Meeting Note is mandatory when status is 'On Hold'");
    return;
  }

  if (!this.meetingForm.get('meetingStatus')?.value) {
    this.meetingForm.get('meetingStatus')?.markAsTouched();
    this.appSettingService.showError("Meeting status is required.");
    return;
  }

  const meetingDateStr = this.meetingForm.value.meetingDate;
  this.btnDisable = true;

  if (this.preCustomerMeetingData.meetingStatus === 'confirmed') {
    this.appSettingService.showError("Meeting status is already confirmed and cannot be edited.");
    this.btnDisable = false;
    return;
  }

  const userEmail = this.appSettingService.userSettingSource.value['userEmail'];
  const isFollowUp = this.meetingForm.get('followUp')?.value === true;
  const payload = {
    PreCustomerMeetingSid: this.preCustomerMeetingData.PreCustomerMeetingSid,
    PreCustomerMasterSid: this.preCustomerMeetingData.PreCustomerMasterSid,
    ...this.meetingForm.getRawValue(),
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    userEmail: userEmail,
    followUp: isFollowUp,
    followUpDate: this.meetingForm.value.followUp ? this.meetingForm.value.followUpDate : null,
    followUpNote: this.meetingForm.value.followUp ? this.meetingForm.value.followUpNote : null,
    meetingDate: meetingDateStr
  };


  this.leadService.createPreCustomerMeeting(payload).subscribe(
    resp => {
      if (resp.data && resp.status) {
        const meetingData = payload;
        const isLeadConfirmedMeeting =
          !!meetingData &&
          meetingData.meetingStatus?.toLowerCase() === 'confirmed' &&
          meetingData.LeadOrCustomer === 'L' &&
          !!meetingData.PreCustomerMasterSid;
        const createdCustomerId = this.extractCreatedCustomerId(resp);

        if (isLeadConfirmedMeeting && createdCustomerId) {
          this.createdCustomerId = createdCustomerId;
          this.modal.open(this.customerCreatedModal, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
        } else {
          this.modalService.openSuccessModal(resp.message);
        }
        this.btnDisable = false;
        this.isMeetingSaving = false;
        this.meetingForm.patchValue(resp.data);
        this.setMeetingFormInitialValue();
        this.modalRef.close();
        this.refreshComponent();
      } else {
        this.btnDisable = false;
        this.isMeetingSaving = false;
        this.modalService.openErrorModal(resp.message);
      }
    },
    error => {
      this.btnDisable = false;
      this.isMeetingSaving = false;
      this.modalService.openErrorModal('Error updating meeting: ' + error.message);
    }
  );
  this.isMeetingSaving = true;
}
  refreshComponent() {
    this.getMeetingDates()
  }





  loadPreCustomerMeetingData(Id: any) {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    forkJoin({
      preCustomerMeeting: this.leadService.getPreCustomerMeeting(Id),
      salesPersons: this.leadService.getAllSalesman(CompanyMasterSid)
    }).subscribe(({ preCustomerMeeting, salesPersons }) => {
      console.log(preCustomerMeeting, 'leadData');
      console.log('Salespersons:', salesPersons);

      this.preCustomerMeetingData = preCustomerMeeting;
      this.salesPersons = salesPersons;

      if (this.preCustomerMeetingData) {
        // const meetingDate = this.preCustomerMeetingData.meetingDate
        //   ? this.formatDateTime(this.preCustomerMeetingData.meetingDate)
        //   : '';

        // const followUpDate = this.preCustomerMeetingData.followUpDate
        //   ? this.formatDateTime(this.preCustomerMeetingData.followUpDate)
        //   : '';

        const meetingDate = this.preCustomerMeetingData.meetingDate
          ? new Date(this.preCustomerMeetingData.meetingDate)
          : '';

        const followUpDate = this.preCustomerMeetingData.followUpDate
          ? new Date(this.preCustomerMeetingData.followUpDate)
          : '';

        // Determine if followUp should be true based on followUpDate or followUpNote
        const followUp = !!this.preCustomerMeetingData.followUpDate;


        this.calendarEventData = this.preCustomerMeetingData;
        const isLead = this.preCustomerMeetingData.LeadOrCustomer === "L";
        const preCustomerMeeting = this.preCustomerMeetingData;
        const name = isLead ? preCustomerMeeting.preCustomerMaster?.preCustomerName : preCustomerMeeting.customerMaster?.CustomerName || 'Unknown';
        this.meetingForm.patchValue({
          LeadOrCustomer: this.preCustomerMeetingData.LeadOrCustomer || 'L',
          PreCustomerMasterSid: this.preCustomerMeetingData.PreCustomerMasterSid || null,
          CustomerMasterSid: this.preCustomerMeetingData.CustomerMasterSid || null,
          customerName: name,
          contactPerson: this.preCustomerMeetingData.preCustomerMaster?.contactPerson || '',
          phone: this.preCustomerMeetingData.preCustomerMaster?.phone || '',
          status: this.preCustomerMeetingData.preCustomerMaster?.status || '',
          meetingDate: meetingDate,
          meetingType: this.preCustomerMeetingData.meetingType,
          meetingNote: this.preCustomerMeetingData.meetingNote,
          meetingStatus: this.preCustomerMeetingData.meetingStatus || 'Scheduled',
          followUp: followUp,  // Automatically set followUp based on API response
          followUpDate: followUp ? followUpDate : '',
          followUpNote: followUp ? this.preCustomerMeetingData.followUpNote || '' : '',
          meetingDuration: this.preCustomerMeetingData.meetingDuration || '10 min',
        });
        this.meetingForm.get('LeadOrCustomer')?.updateValueAndValidity();
this.meetingForm.get('PreCustomerMasterSid')?.updateValueAndValidity();
this.meetingForm.get('CustomerMasterSid')?.updateValueAndValidity();
        this.updateFollowUpValidators();

        const followUpControl = this.meetingForm.get('followUp');
        followUpControl?.updateValueAndValidity();
        this.meetingForm.get('LeadOrCustomer')?.updateValueAndValidity();
        this.meetingForm.controls['meetingStatus'].enable();
        if (this.preCustomerMeetingData.meetingStatus === 'confirmed') {
          this.meetingForm.controls['meetingStatus'].disable();
        }

        // Assign salesperson
        const selectedPerson = this.salesPersons.find(
          person => person.UserMasterSid === this.preCustomerMeetingData?.leadAssignTo
        );
        console.log('Selected SalesPerson:', selectedPerson);
        // **Fix: Delay the assignment to ensure UI updates**
        setTimeout(() => {
          this.meetingForm.controls['leadAssignTo'].setValue(selectedPerson?.UserMasterSid || '', {
            emitEvent: false,
          });
          this.setMeetingFormInitialValue();
          this.cdr.detectChanges(); // Ensure Angular detects the change
        });

      }
    });
  }

  private setMeetingFormInitialValue(): void {
    this.initialMeetingFormValue = this.meetingForm.getRawValue();
    this.isMeetingDirty = false;
  }

  private normalizeValue(value: any): any {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((v) => this.normalizeValue(v));
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
    return JSON.stringify(this.normalizeValue(obj1)) === JSON.stringify(this.normalizeValue(obj2));
  }

  canCloseMeetingModal(): boolean | Promise<boolean> {
    if (this.isMeetingSaving) return false;
    if (!this.isMeetingDirty) return true;

    const modalRef = this.modal.open(UnsavedChangesDialogComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    return modalRef.result
      .then((action: UnsavedChangesAction) => action === 'discard')
      .catch(() => false);
  }

  async closeAddMeetingModal(): Promise<void> {
    const canClose = await Promise.resolve(this.canCloseMeetingModal());
    if (!canClose) return;
    this.modalAddFormRef?.close();
  }

  async closeUpdateMeetingModal(): Promise<void> {
    const canClose = await Promise.resolve(this.canCloseMeetingModal());
    if (!canClose) return;
    this.modalRef?.close();
  }


  formatDateForInput(dateString: string) {
    const date = new Date(dateString);
    // return date;
    return date.toISOString().slice(0, 16); // Extracts 'YYYY-MM-DDTHH:MM'
  }

  parseDuration(duration: string): number {
    if (!duration) return 30; // default 30 minutes
    const match = duration.match(/(\d+)\s*min/);
    return match ? parseInt(match[1], 10) : 30;
  }

  // Treat UTC string as "local" without converting
convertUTCToLocal(utcDate: string | null): Date | null {
 
  if (!utcDate) {
    return null;
  }
 
  const parts = utcDate.match(/\d+/g);
 
  if (!parts) {
    return null;
  }
 
  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2]),
    Number(parts[3] || 0),
    Number(parts[4] || 0),
    Number(parts[5] || 0)
  );
}
 
  resetForm() {
    this.meetingForm.reset();
  }

  showInfo() {
    if (!this.calendarEventData) return;
    const modalRef = this.ngbModal.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.calendarEventData;
    modalRef.componentInstance.idLabel = 'Meeting Id';
    modalRef.componentInstance.idValue = this.calendarEventData?.PreCustomerMeetingSid;
  }

  openAuditLogs() {
        if (!this.calendarEventData?.PreCustomerMeetingSid) return;
        const modalRef = this.modal.open(AuditLogComponent, {
          centered: true,
          scrollable: true,
          size: 'xl',
          windowClass: 'audit-log-modal'
        });
        modalRef.componentInstance.title = 'Meeting Logs';
        modalRef.componentInstance.tableName = 'PreCustomerMeeting';
        modalRef.componentInstance.recordId = this.calendarEventData?.PreCustomerMeetingSid.toString();
        modalRef.componentInstance.screenName = 'Meeting';
      }

  // openTandC() {
  //   this.currentMenuId = Number(sessionStorage.getItem('currentMenuId'));
  //   const payload = { MenuMasterSid: this.currentMenuId };
  //   this.leadService.getTandCByCondition(payload).subscribe(
  //     (resp: any) => {
  //       if (resp.status) {
  //         this.TandCList = resp.data;
  //         const modalRef = this.ngbModal.open(TermsAndConditionsComponent, {
  //           size: 'lg',
  //           backdrop: 'static',
  //           centered: true
  //         });
  //         modalRef.componentInstance.terms = this.TandCList;
  //         modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
  //         modalRef.componentInstance.DocumentSid = this.calendarEventData?.PreCustomerMeetingSid;

  //       } else {
  //         this.appSettingService.showError('Error loading Terms and Conditions');
  //       }
  //     },
  //     (error) => {
  //       this.appSettingService.showError('Error loading Terms and Conditions', error);
  //     }
  //   );
  // }
  openEmail() {
    if (!this.calendarEventData) return;
    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });
  }

  openAuthority() {
    // if (!this.tariffData) return;
    // const modalRef = this.modalService.open(AuthorityEntryComponent, {
    // 	size: 'lg',
    // 	centered: true,
    // 	backdrop: 'static'
    // });
  }

  openEDoc() {
    // if (!this.tariffData) return;
    // const modalRef = this.modalService.open(EdocComponent, {
    // 	size: 'lg',
    // 	centered: true,
    // 	backdrop: 'static'
    // });
  }

  canUpdate():boolean{
    console.log("Can Update",this.mps.can('update'));
    return !this.mps.can('update');
  }

  private extractCreatedCustomerId(resp: any): number | null {
    const candidate =
      resp?.data?.createdCustomer?.CustomerMasterSid ??
      resp?.data?.CustomerMasterSid ??
      resp?.data?.customerMaster?.CustomerMasterSid ??
      null;

    const numericId = Number(candidate);
    return Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  }

  navigateToCreatedCustomer(): void {
    if (!this.createdCustomerId) return;
    this.router.navigate(['master/organization/entry', this.createdCustomerId]);
    this.closeCustomerCreatedModal();
  }

  closeCustomerCreatedModal(): void {
    this.createdCustomerId = null;
    this.modal.dismissAll();
  }


}
