import { AppSettingsService } from './../../../core/services/app-settings.service';
import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { startOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours, } from 'date-fns';
import { Subject } from 'rxjs';
import { NgbActiveModal, NgbDatepickerModule, NgbModal, NgbModalRef, } from '@ng-bootstrap/ng-bootstrap';
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
  imports: [CalendarModule, FormsModule, ReactiveFormsModule, CommonModule, FlatpickrModule, FeatherModule, PreventMultiClickDirective,NgSelectModule,NgbDatepickerModule,DateTimePickerComponent],

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

  meetingDurations = [
  { label: '10 min', value: '10 min' },
  { label: '20 min', value: '20 min' },
  { label: '30 min', value: '30 min' },
  { label: '40 min', value: '40 min' },
  { label: '50 min', value: '50 min' },
  { label: '1 hr', value: '1 hr' }
];

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
  currentMenuId: number;
  TandCList: any;
  currentCompany: any;
  currentBranch: any;
  leadList : any[] = [];

  constructor(private modalService: ModalService, private cdr: ChangeDetectorRef, private appSettingService: AppSettingsService, private fb: FormBuilder, private leadService: LeadService, private modal: NgbModal, private appService: AppService,private ngbModal: NgbModal) { }

  ngOnInit(): void {
   const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
    this.isMobile = this.appService.getDevice()
    this.loadCustomers()
    this.loadLeads();
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
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    this.leadService.getAllCustomers(CompanyMasterSid).subscribe(
      (resp: any) => {
        this.customers = resp
      });
  }

  loadLeads(){
    const filterOption = { 
      CompanyMasterSid : this.currentCompany?.CompanyMasterSid,
      BranchMasterSid : this.currentBranch?.BranchMasterSid
    }
    this.leadService.fetchAllLeads(filterOption).subscribe(
      (resp: any) => {
        this.leadList = resp.data
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
      LeadOrCustomer: 'L',
      followUp: false,
      meetingStatus: 'scheduled' 
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
      LeadOrCustomer: ["L", Validators.required],
      customerName: ['', Validators.required],
      CustomerMasterSid : [null],
      PreCustomerMasterSid : [null],
      meetingDate: [''],
      followUpDate: [''],
      followUp: [false],
      meetingType: ['', Validators.required],
      leadAssignTo: ['', Validators.required],
      meetingNote: ['', this.meetingNoteValidator.bind(this)],
      meetingStatus: ['scheduled', Validators.required],
      followUpNote: [''],
      meetingDuration:['10 min']
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
  // first clear events
  this.events = [];

  this.leadService.getMeetings().subscribe((meetingRes: any) => {
    let meetingEvents: any[] = [];

    if (meetingRes.status && meetingRes.data.length) {
      meetingEvents = meetingRes.data
        .filter((meeting) => meeting.meetingStatus !== "confirmed")
        .map((meeting: any) => {
          const hasFollowUp = !!meeting.followUpDate;
          const isLead = meeting.LeadOrCustomer === "L";
          const name = isLead
            ? meeting?.preCustomerMaster?.preCustomerName
            : meeting?.customerMaster?.CustomerName || "Unknown";

          return {
            start: this.convertUTCToLocal(meeting.meetingDate),
            title:`Meeting with - ${name}`,
            id: meeting.PreCustomerMeetingSid,
            color:  { primary: "#33cc33", secondary: "#ccffcc" }
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
            .filter((meeting) => meeting.meetingStatus !== "confirmed")
            .map((meeting: any) => {
              const meetingData = meeting.preCustomerMeeting;
              const isCustomer = meetingData.LeadOrCustomer === "C";

              const person = isCustomer
                ? meetingData.customerMaster?.CustomerName
                : meetingData.preCustomerMaster?.preCustomerName;

              return {
                start: this.convertUTCToLocal(meeting.FollowupDate),
                title: `Follow up meeting with - ${person}`,
                id: meeting.PreCustomerMeetingSid,
                color: { primary: "#ff5733", secondary: "#ffcccb" }
              };
            });
        }

        // ✅ Merge both meetings + followups
        this.events = [...meetingEvents, ...followUpEvents];

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
    ...this.meetingForm.value,
    meetingDate : meetingDateStr,
    followUpDate: this.meetingForm.value.followUpDate,
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
        this.meetingForm.patchValue(resp.data);
        this.modalAddFormRef.close();
        this.refreshComponent();
      } else {
        this.btnDisable = false;
        this.modalService.openErrorModal(resp.message);
      }
    },
    error => {
      this.btnDisable = false;
      this.modalService.openErrorModal('Error creating meeting: ' + error.message);
    }
  );
  this.btnDisable = false;
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
    const userEmail = this.appSettingService.userSettingSource.value['userEmail'];

    // Convert followUpDate in same format as meetingDate
let followUpDate: string = null;
if (this.meetingForm.value.followUp && this.meetingForm.value.followUpDate) {
  const dt = new Date(this.meetingForm.value.followUpDate);
  const hours = dt.getHours().toString().padStart(2, '0');
  const minutes = dt.getMinutes().toString().padStart(2, '0');
  const year = dt.getFullYear();
  const month = (dt.getMonth() + 1).toString().padStart(2, '0');
  const day = dt.getDate().toString().padStart(2, '0');

  followUpDate = `${year}-${month}-${day}T${hours}:${minutes}`;
}
   const payload = {
    PreCustomerMeetingSid: this.preCustomerMeetingData.PreCustomerMeetingSid,
    PreCustomerMasterSid: this.preCustomerMeetingData.PreCustomerMasterSid,
    ...this.meetingForm.getRawValue(),
    CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.currentBranch?.BranchMasterSid,
    userEmail: userEmail,
    followUpDate:followUpDate
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
    },
    error => {
      this.btnDisable = false;
      this.modalService.openErrorModal('Error updating meeting: ' + error.message);
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
        const isLead = this.preCustomerMeetingData.LeadOrCustomer === "L";
        const preCustomerMeeting = this.preCustomerMeetingData;
        const name = isLead ? preCustomerMeeting.preCustomerMaster?.preCustomerName : preCustomerMeeting.customerMaster?.CustomerName || 'Unknown';
        this.meetingForm.patchValue({
          customerName: name,
          contactPerson: this.preCustomerMeetingData.preCustomerMaster?.contactPerson || '',
          phone: this.preCustomerMeetingData.preCustomerMaster?.phone || '',
          status: this.preCustomerMeetingData.preCustomerMaster?.status || '',
          meetingDate: meetingDate,
          meetingType: this.preCustomerMeetingData.meetingType,
          meetingNote: this.preCustomerMeetingData.meetingNote,
          meetingStatus: this.preCustomerMeetingData.meetingStatus || 'scheduled',
          followUp: followUp,  // Automatically set followUp based on API response
          followUpDate: followUp ? followUpDate : '',
          followUpNote: followUp ? this.preCustomerMeetingData.followUpNote || '' : '',
          meetingDuration:this.preCustomerMeetingData.meetingDuration,
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

  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.leadService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.ngbModal.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.calendarEventData?.PreCustomerMeetingSid;

        } else {
          this.appSettingService.showError('Error loading Terms and Conditions');
        }
      },
      (error) => {
        this.appSettingService.showError('Error loading Terms and Conditions', error);
      }
    );
  }
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


  

}
