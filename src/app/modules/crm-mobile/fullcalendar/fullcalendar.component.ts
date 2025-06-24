import { AppSettingsService } from './../../../core/services/app-settings.service';
import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { startOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours, } from 'date-fns';
import { Subject } from 'rxjs';
import { NgbActiveModal, NgbModal, NgbModalRef, } from '@ng-bootstrap/ng-bootstrap';
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
  imports: [CalendarModule, FormsModule, ReactiveFormsModule, CommonModule, FlatpickrModule, FeatherModule, PreventMultiClickDirective],

  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fullcalendar.component.html',
  styleUrls: ['./fullcalendar.component.scss'],
})
export class FullcalendarComponent implements OnInit {
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
  calendarEventData : any;


  viewDate: Date = new Date();
  customers: any
  isMobile: boolean = false;
  meetingForm: FormGroup;
  errorMessage: string = '';  // To store any error messages
  btnDisable: boolean = false;
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
  constructor(private modalService: ModalService, private cdr: ChangeDetectorRef, private appSettingService: AppSettingsService, private fb: FormBuilder, private leadService: LeadService, private modal: NgbModal, private appService: AppService,private ngbModal: NgbModal) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
    this.loadCustomers()
    this.loadSalesPersons()
    this.initForm();
    console.log('Default meetingStatus:', this.meetingForm.get('meetingStatus')?.value);
    this.getMeetingDates()
    this.minDate = this.getCurrentDateTime();
  }


  getCurrentDateTime(): string {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format as 'YYYY-MM-DDTHH:mm'
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
    this.modalData = { event, action };
    this.PreCustomerMeetingSid = event.id
    // console.log(this.PreCustomerMeetingSid)
    if (event.id) {
      this.loadPreCustomerMeetingData(event.id)
    }
    // this.modal.open(this.modalContent, { size: 'lg' });
    // this.modal.open(this.modalContentAdd, { size: 'lg' })
    this.modalRef = this.modal.open(this.modalContentAdd, { size: 'lg' });
    // Ensure edit mode patches values and disables fields
    this.meetingForm.get('customerName').disable();
    this.meetingForm.get('meetingDate').disable();
    this.meetingForm.get('meetingType').disable();
    this.meetingForm.get('leadAssignTo').disable();
  }

  loadCustomers(): void {
    this.leadService.getAllCustomers().subscribe(
      (resp: any) => {
        this.customers = resp
      });
  }

  loadSalesPersons() {
    this.leadService.getAllSalesPerson().subscribe(
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
    followUp: false,
    meetingStatus: 'scheduled' // Ensure default is set on reset
  });

    // Ensure the followUp checkbox has a default false value to prevent undefined state
    this.meetingForm.patchValue({ followUp: false });

    // Open new meeting modal
    this.modalAddFormRef = this.modal.open(this.modalContentAddForm, { size: 'lg' });

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


  initForm() {
    this.meetingForm = this.fb.group({
      customerName: ['', Validators.required],
      PreCustomerMeetingid: [''],
      meetingDate: [''],
      followUpDate: [''],
      followUp: [false],
      meetingType: ['', Validators.required],
      leadAssignTo: ['', Validators.required],
      meetingNote: ['', this.meetingNoteValidator.bind(this)],
      meetingStatus: ['scheduled', Validators.required],
      followUpNote: ['']
    });
     this.meetingForm.get('meetingStatus').valueChanges.subscribe(() => {
    this.meetingForm.get('meetingNote').updateValueAndValidity();
  });
}
private meetingNoteValidator(control: AbstractControl) {
  const status = this.meetingForm?.get('meetingStatus')?.value;
  if (status === 'on hold' && !control.value) {
    return { required: true };
  }
  return null;
}


  toggleFollowUp(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.meetingForm.patchValue({ followUp: isChecked });

    // If unchecked, reset followUpDate and followUpNote
    if (!isChecked) {
      this.meetingForm.patchValue({ followUpDate: null, followUpNote: '' });
    }
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

  getMeetingDates() {
    this.leadService.getMeetings().subscribe((response: any) => {
      if (response.status && response.data.length) {
        this.events = response.data
          .filter((meeting) => meeting.meetingStatus !== "confirmed") //excluded the confirmed meeting record
          .map((meeting: any) => {
            const hasFollowUp = !!meeting.followUpDate; // Ensure followUpDate is checked for each meeting
            return {
              // start: startOfDay(new Date(meeting.meetingDate)), // Ensure correct format
              start: this.convertUTCToLocal(meeting.meetingDate),
              title: !hasFollowUp ?
                `Meeting with - ${meeting.preCustomerMaster.preCustomerName}` : `Follow up meeting with - ${meeting.preCustomerMaster.preCustomerName}`,
              id: meeting.PreCustomerMeetingSid,
              color: hasFollowUp
                ? { primary: '#ff5733', secondary: '#ffcccb' } // Red for no follow-up (lighter red background)
                : { primary: '#33cc33', secondary: '#ccffcc' } // Green for follow-up (lighter green background)
            };
          });
      }

      this.refresh.next(); // Force refresh to apply changes
      console.log(this.events);
    });
  }

  selectedCustomerName: any;


  onCustomerChange(event: Event): void {
    const selectedCustomerName = (event.target as HTMLSelectElement).value;
    this.meetingForm.get('customerName')?.setValue(selectedCustomerName);

    // Find the selected customer object
    const selectedCustomer = this.customers.find(cust => cust.CustomerName === selectedCustomerName);

    // Set PreCustomerMeetingSid if found
    if (selectedCustomer) {
      this.meetingForm.get('PreCustomerMeetingid')?.setValue(selectedCustomer.CustomerMasterSid);
    } else {
      this.meetingForm.get('PreCustomerMeetingid')?.setValue(null); // Reset if no match
    }
  }


  onAddMeeting() {

    console.log(this.meetingForm.value)
    this.leadService.createPreCustomerMeeting(this.meetingForm.value).subscribe(
      resp => {
        if (resp.data && resp.status) {
          // this.appSettingService.showSuccess(resp.message);
          this.modalService.openSuccessModal(resp.message);
          this.btnDisable = false;
          this.meetingForm.patchValue(resp.data);
          this.modalAddFormRef.close();

          this.refreshComponent();
        } else {
          this.btnDisable = false;
          // this.appSettingService.showError(resp.message);
          this.modalService.openErrorModal(resp.message);
        }
      }
    )
  }

  // Handle Form Submission
  onEditMeeting() {
  // Check if meeting status is "on hold" and note is empty
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

  // Rest of your existing code...
  this.btnDisable = true;
  if (this.preCustomerMeetingData.meetingStatus === 'confirmed') {
    this.appSettingService.showError("Meeting status is already confirmed and cannot be edited.");
    return;
  }

  const payload = {
    PreCustomerMeetingSid: this.PreCustomerMeetingSid,
    ...this.meetingForm.getRawValue(),
  };

  // If followUp is false, remove followUpNote and followUpDate from the payload
  if (!this.meetingForm.get('followUp')?.value) {
    delete payload.followUpNote;
    delete payload.followUpDate;
  }

  this.leadService.createPreCustomerMeeting(payload).subscribe(
    resp => {
      if (resp.data && resp.status) {
        this.modalService.openSuccessModal(resp.message);
        this.btnDisable = false;
        this.meetingForm.patchValue(resp.data);
        this.modalRef.close();
        this.refreshComponent();
      } else {
        this.btnDisable = false;
        this.modalService.openErrorModal(resp.message);
      }
    }
  );
  this.btnDisable = false;
}
  refreshComponent() {
    this.getMeetingDates()
  }




  loadPreCustomerMeetingData(Id: any) {
    forkJoin({
      preCustomerMeeting: this.leadService.getPreCustomerMeeting(Id),
      salesPersons: this.leadService.getAllSalesPerson()
    }).subscribe(({ preCustomerMeeting, salesPersons }) => {
      console.log(preCustomerMeeting, 'leadData');
      console.log('Salespersons:', salesPersons);

      this.preCustomerMeetingData = preCustomerMeeting;
      this.salesPersons = salesPersons;

      if (this.preCustomerMeetingData) {
        const meetingDate = this.preCustomerMeetingData.meetingDate
          ? this.formatDateForInput(this.preCustomerMeetingData.meetingDate)
          : '';

        const followUpDate = this.preCustomerMeetingData.followUpDate
          ? this.formatDateForInput(this.preCustomerMeetingData.followUpDate)
          : '';

        // Determine if followUp should be true based on followUpDate or followUpNote
        const followUp = !!(this.preCustomerMeetingData.followUpDate || this.preCustomerMeetingData.followUpNote);


        this.calendarEventData = this.preCustomerMeetingData;
        this.meetingForm.patchValue({
          customerName: this.preCustomerMeetingData.preCustomerMaster?.preCustomerName || '',
          contactPerson: this.preCustomerMeetingData.preCustomerMaster?.contactPerson || '',
          phone: this.preCustomerMeetingData.preCustomerMaster?.phone || '',
          status: this.preCustomerMeetingData.preCustomerMaster?.status || '',
          meetingDate: meetingDate,
          meetingType: this.preCustomerMeetingData.meetingType,
          meetingNote: this.preCustomerMeetingData.meetingNote,
          meetingStatus: this.preCustomerMeetingData.meetingStatus || 'scheduled',
          followUp: followUp,  // Automatically set followUp based on API response
          followUpDate: followUp ? followUpDate : '',
          followUpNote: followUp ? this.preCustomerMeetingData.followUpNote || '' : ''
        });

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
          this.cdr.detectChanges(); // Ensure Angular detects the change
        });

      }
    });
  }


  formatDateForInput(dateString: string) {
    const date = new Date(dateString);
    // return date;
    return date.toISOString().slice(0, 16); // Extracts 'YYYY-MM-DDTHH:MM'
  }

  // ✅ Convert UTC timestamp to local date without shifting time
  convertUTCToLocal(utcDate: string): Date {
    const date = new Date(utcDate);

    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
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

}
