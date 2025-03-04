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
  imports: [CalendarModule, FormsModule, ReactiveFormsModule, CommonModule, FlatpickrModule, FeatherModule,],

  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './fullcalendar.component.html',
  styleUrls: ['./fullcalendar.component.scss'],
})
export class FullcalendarComponent implements OnInit {
  @ViewChild('modalContent', { static: true }) modalContent!: TemplateRef<any>;
  @ViewChild('modalContentAdd', { static: true })
  modalContentAdd!: TemplateRef<any>;

  view: CalendarView = CalendarView.Month;
  PreCustomerMeetingSid: any
  CalendarView = CalendarView;
  // Declare modalRef with type NgbModalRef
  modalRef!: NgbModalRef;
  viewDate: Date = new Date();

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
  constructor(private cdr: ChangeDetectorRef, private appSettingService: AppSettingsService, private fb: FormBuilder, private leadService: LeadService, private modal: NgbModal, private appService: AppService) { }

  ngOnInit(): void {
    this.isMobile = this.appService.getDevice()
    this.initForm();
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
  }


  // loadSalesPerson(): void {
  //   this.leadService.getAllSalesPerson().subscribe(
  //     (resp: any) => {
  //       this.salesPersons = resp
  //       // Find the person based on stored UserMasterSid and set the form control
  //       const selectedPerson = this.salesPersons.find(
  //         person => person.UserMasterSid === this.preCustomerMeetingData?.leadAssignTo
  //       );
  //       console.log(typeof selectedPerson)

  //       this.meetingForm.patchValue({ leadAssignTo: selectedPerson?.UserMasterSid || null });
  //     });
  // }
  /*/////////////////////////////////////
  Add Event
  ////////////////////////////////////*/
  addEvent(): void {
    this.modal.open(this.modalContentAdd, {
      size: 'lg',
    });
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

  closeOpenMonthViewDay() {
    this.activeDayIsOpen = false;
  }


  initForm() {
    this.meetingForm = this.fb.group({
      customerName: ['', Validators.required],
      meetingDate: [''],
      followUpDate: [''],
      followUp: [false],
      meetingType: ['', Validators.required],
      leadAssignTo: ['', Validators.required],
      meetingNote: ['', Validators.required],
      meetingStatus: ['', Validators.required],
      followUpNote: ['']
    });
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
        this.events = response.data.map((meeting: any, index: number) => ({
          start: startOfDay(new Date(meeting.meetingDate)), // Ensure correct format
          title: `${meeting.preCustomerMaster.preCustomerName} Meeting`,
          id: meeting.PreCustomerMeetingSid,
          color: { primary: '#1e90ff', secondary: '#D1E8FF' }, // Set color
        }));
      }
      this.refresh.next(); // Force refresh
      console.log(this.events)
    });
  }





  // Handle Form Submission
  onEditMeeting() {
    // Check if meetingStatus is already confirmed
    if (this.preCustomerMeetingData.meetingStatus === 'confirmed') {
      this.appSettingService.showError("Meeting status is already confirmed and cannot be edited.");
      return;
    }
    const payload = {
      PreCustomerMeetingSid: this.PreCustomerMeetingSid,
      ...this.meetingForm.value,
    };

    this.btnDisable = true;
    this.leadService.createPreCustomerMeeting(payload).subscribe(
      resp => {
        if (resp.data && resp.status) {
          this.appSettingService.showSuccess(resp.message);
          this.btnDisable = false;
          this.meetingForm.patchValue(resp.data);
          this.modalRef.close();

          this.refreshComponent();
        } else {
          this.appSettingService.showError(resp.message);
        }
      }
    )
    console.log('Update Meeting:', payload);
    this.btnDisable = false;
  }

  refreshComponent() {
    this.getMeetingDates()
  }


  // // Fetch lead data and patch the form
  // loadPreCustomerMeetingData(Id: any) {
  //   // Ensure salesperson is loaded every time

  //   this.leadService.getPreCustomerMeeting(Id).subscribe(
  //     (resp) => {
  //       this.loadSalesPerson();
  //       console.log(resp, 'leadData')
  //       this.preCustomerMeetingData = resp
  //       if (this.preCustomerMeetingData) {
  //         const meetingDate = this.preCustomerMeetingData.meetingDate
  //           ? this.formatDateForInput(this.preCustomerMeetingData.meetingDate)
  //           : '';

  //         const followUpDate = this.preCustomerMeetingData.followUpDate
  //           ? this.formatDateForInput(this.preCustomerMeetingData.followUpDate)
  //           : '';
  //         this.meetingForm.patchValue({
  //           customerName: this.preCustomerMeetingData.preCustomerMaster.preCustomerName || '',
  //           contactPerson: this.preCustomerMeetingData.preCustomerMaster.contactPerson || '',
  //           phone: this.preCustomerMeetingData.preCustomerMaster.phone || '',
  //           status: this.preCustomerMeetingData.preCustomerMaster.status || '',
  //           meetingDate: meetingDate,
  //           meetingType: this.preCustomerMeetingData.meetingType,
  //           meetingNote: this.preCustomerMeetingData.meetingNote,
  //           meetingStatus: this.preCustomerMeetingData.meetingStatus || '',
  //           followUpDate: followUpDate || '',
  //           followUpNote: this.preCustomerMeetingData.followUpNote || ''
  //         });
  //         // Reset the field before applying any condition
  //         this.meetingForm.controls['meetingStatus'].enable();
  //         // If meetingStatus is "confirmed", disable the field
  //         if (this.preCustomerMeetingData.meetingStatus === 'confirmed') {
  //           this.meetingForm.controls['meetingStatus'].disable();
  //         }
  //       }

  //     }
  //   );
  // }



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

        this.meetingForm.patchValue({
          customerName: this.preCustomerMeetingData.preCustomerMaster?.preCustomerName || '',
          contactPerson: this.preCustomerMeetingData.preCustomerMaster?.contactPerson || '',
          phone: this.preCustomerMeetingData.preCustomerMaster?.phone || '',
          status: this.preCustomerMeetingData.preCustomerMaster?.status || '',
          meetingDate: meetingDate,
          meetingType: this.preCustomerMeetingData.meetingType,
          meetingNote: this.preCustomerMeetingData.meetingNote,
          meetingStatus: this.preCustomerMeetingData.meetingStatus || '',
          followUpDate: followUpDate || '',
          followUpNote: this.preCustomerMeetingData.followUpNote || ''
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


  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Extracts 'YYYY-MM-DDTHH:MM'
  }


  resetForm() {
    this.meetingForm.reset();
  }
}
