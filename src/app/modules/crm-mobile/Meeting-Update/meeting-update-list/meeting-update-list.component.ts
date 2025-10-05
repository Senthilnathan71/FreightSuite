import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbDropdownModule, NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { AppService } from 'src/app/service/app.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from '../../Services/lead.service';
import { forkJoin } from 'rxjs';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { DetailsComponent } from 'src/app/component/details/details.component';
import { EmailEntryComponent } from 'src/app/modules/settings/email/email-entry/email-entry.component';
import { TermsAndConditionsComponent } from 'src/app/component/terms&conditions/terms&conditions.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { FavoriteStarComponent } from 'src/app/component/favourite/favourite.component';
import { LeadStatus, LeadStatusLabels } from 'src/app/common/helper';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';

@Component({
  selector: 'app-meeting-update-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    ReactiveFormsModule,
    PreventMultiClickDirective,
    NgxSpinnerModule,
    NgbDropdownModule,
    FavoriteStarComponent,
    NgSelectModule,
    DateTimePickerComponent
  ],
  templateUrl: './meeting-update-list.component.html',
  styleUrls: ['./meeting-update-list.component.scss']
})
export class MeetingUpdateListComponent implements OnInit {
  meetings: any[] = [];        // Array to store all meetings
  filteredMeetings: any[] = []; // Array to store filtered meetings
  errorMessage: string = '';  // To store any error messages
  // pagination
  page = 1;
  pageSize = 5;
  isEditMode: boolean = false;
  totalLengthOfCollection: number = 0;
  searchText: string = '';
  isMobile: boolean = false;
  modalRef: NgbModalRef;
  meetingForm: FormGroup;
  salesPersons: any[] = [];
  btnDisable: boolean = false;
  selectedMeeting: any;
  meetingData: any;
  currentMenuId: number;
  TandCList: any;
  currentCompany: any;
  currentBranch: any;
  meetingDurations = [
  { label: '10 min', value: '10 min' },
  { label: '20 min', value: '20 min' },
  { label: '30 min', value: '30 min' },
  { label: '40 min', value: '40 min' },
  { label: '50 min', value: '50 min' },
  { label: '1 hr', value: '1 hr' }
];
reasonList=[
  {id:1,name:"Customer Postponed"},
  {id:2,name:"Salesman on Leave"},
  {id:3,name:"Salesman having other meeting"},
  {id:4,name:"Natural Calamity"},
  {id:5,name:"Assigned to New Salesman "}
]
  constructor(
    private router: Router,
    private appService: AppService,
    private appSettingService: AppSettingsService,
    private leadService: LeadService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private commonModalService: ModalService,
    private spinner: NgxSpinnerService,
  ) { }
  ngOnInit(): void {
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.isMobile = this.appService.getDevice();
    this.loadMeetings();
    this.loadSalesPersons();
    this.initMeetingForm();
  }

  initMeetingForm() {
    this.meetingForm = this.fb.group({
      customerName: ['', Validators.required],
      PreCustomerMeetingSid: [''],
      meetingDate: ['', Validators.required],
      followUpDate: [''],
      followUp: [false],
      meetingType: ['', Validators.required],
      leadAssignTo: ['', Validators.required],
      meetingNote: ['', this.meetingNoteValidator.bind(this)],
      meetingStatus: ['Scheduled', Validators.required],
      followUpNote: [''],
      meetingDuration:[''],
      reason:[''],
      preCustomerMasterSid: [''],
      createdBy:[''],
      updatedBy:['']
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

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.meetingForm.controls;
  }

  loadSalesPersons() {
    this.leadService.getAllSalesPerson().subscribe(
      (resp: any) => {
        this.salesPersons = resp;
      }
    );
  }

  loadMeetings(): void {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    this.leadService.getAllPreCustomerMeetings(CompanyMasterSid, BranchMasterSid).subscribe(
      (resp: any) => {
        if (resp.status && resp.data.length) {
          // Filter meetings to only include specified statuses
              console.log(resp.data, 'resp.data')

          this.meetings = resp.data
            // .filter((meeting: any) => {
            //   const status = meeting.meetingStatus?.toLowerCase();
            //   return status === 'Scheduled' || status === 'In Progress' || status === 'On Hold';
            // })
            .map((meeting: any) => {
              const salesPerson = this.salesPersons?.find(
                (person: any) => person.UserMasterSid === meeting.leadAssignTo
              );
              console.log(meeting, 'meeting')
              return {
                PreCustomerMeetingSid: meeting.PreCustomerMeetingSid,
                customerName: meeting.preCustomerMaster?.preCustomerName || 'N/A',
                meetingType: meeting.meetingType || 'N/A',
                meetingDate: meeting.meetingDate,
                salesPerson: salesPerson?.userName || 'N/A',
                leadAssignTo: meeting.leadAssignTo,
                status: meeting.status === "A" ? "Active" : "InActive",
                meetingStatus: meeting.meetingStatus || '',
                leadStatus: LeadStatusLabels[meeting?.preCustomerMaster?.leadStatus as LeadStatus] || "-",
                preCustomerMaster: meeting.preCustomerMaster,
                userMaster: meeting.userMaster,
                followUp: meeting.followUpDate || meeting.followUpNote,
                followUpDate: meeting.followUpDate,
                followUpNote: meeting.followUpNote,
                meetingNote: meeting.meetingNote,
                createdBy: meeting.createdBy,
                createdOn: meeting.createdOn,
                updatedBy: meeting.updatedBy,
                updatedOn: meeting.updatedOn,
              };
            });
          this.filteredMeetings = [...this.meetings];
          this.totalLengthOfCollection = this.filteredMeetings.length;
          this.updatePaginatedData();
        }
      },
      (error) => {
        this.errorMessage = 'Failed to load meetings';
        this.appSettingService.showError(this.errorMessage);
      }
    );
  }

  updatePaginatedData(): void {
    const startIndex = (this.page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredMeetings = this.meetings.slice(startIndex, endIndex);
  }

  searchMeetings(): void {
    const searchQuery = this.searchText?.toLowerCase().trim();

    if (!searchQuery) {
      this.filteredMeetings = [...this.meetings];
    } else {
      this.filteredMeetings = this.meetings.filter((meeting) => {
        return (
          meeting.customerName?.toLowerCase().includes(searchQuery) ||
          meeting.meetingType?.toLowerCase().includes(searchQuery) ||
          meeting.salesPerson?.toLowerCase().includes(searchQuery) ||
          String(meeting.meetingDate).toLowerCase().includes(searchQuery) ||
          meeting.status.toLowerCase().includes(searchQuery) ||
          meeting.preCustomerMaster.leadStatus.toLowerCase().includes(searchQuery)
        );
      });
    }

    this.totalLengthOfCollection = this.filteredMeetings.length;
    this.page = 1; // Reset to first page when searching
    this.updatePaginatedData();
  }

  openModal(content: TemplateRef<any>, meeting: any) {
    this.initMeetingForm();
    if (meeting) {
      this.meetingData = meeting
      const ourSalesperson = this.salesPersons.find(person => person.UserMasterSid === meeting.leadAssignTo);
      this.meetingForm.patchValue({
        ...meeting,
        leadAssignTo: ourSalesperson
      });
    }
    this.loadMeetingData(meeting.PreCustomerMeetingSid);
    this.modalRef = this.modalService.open(content, { size: 'lg' });
  }

  loadMeetingData(meetingId: number) {
    this.spinner.show();
    this.leadService.getPreCustomerMeeting(meetingId).subscribe(
      (meeting: any) => {
        this.selectedMeeting = meeting;

        const meetingDate = meeting.meetingDate
          ? this.formatDateForInput(meeting.meetingDate)
          : '';

        const followUpDate = meeting.followUpDate
          ? this.formatDateForInput(meeting.followUpDate)
          : '';

        const followUp = !!(meeting.followUpDate || meeting.followUpNote);

        this.meetingForm.patchValue({
          customerName: meeting.preCustomerMaster?.preCustomerName || '',
          PreCustomerMeetingSid: meeting.PreCustomerMeetingSid,
          meetingDate: meetingDate,
          meetingType: meeting.meetingType,
          leadAssignTo: meeting.leadAssignTo,
          meetingNote: meeting.meetingNote,
          meetingStatus: meeting.meetingStatus || 'Scheduled',
          followUp: followUp,
          followUpDate: followUp ? followUpDate : '',
          followUpNote: followUp ? meeting.followUpNote || '' : '',
          meetingDuration: meeting.meetingDuration,
           preCustomerMasterSid: meeting.preCustomerMaster?.PreCustomerMasterSid || null,
           createdBy: meeting.createdBy,
           updatedBy:meeting.updatedBy
        });

        // Disable fields that shouldn't be edited
        // this.meetingForm.get('customerName').disable();
        // this.meetingForm.get('meetingDate').disable();
        // this.meetingForm.get('meetingType').disable();
        // this.meetingForm.get('leadAssignTo').disable();

        // Enable status field unless it's confirmed
        this.meetingForm.controls['meetingStatus'].enable();
        if (meeting.meetingStatus === 'confirmed') {
          this.meetingForm.controls['meetingStatus'].disable();
        }
        this.spinner.hide();
      }
    );
  }

  formatDateForInput(dateString: string) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Extracts 'YYYY-MM-DDTHH:MM'
  }

  onUpdateMeeting() {
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

    if (this.selectedMeeting.meetingStatus === 'confirmed') {
      this.appSettingService.showError("Meeting status is already confirmed and cannot be edited.");
      return;
    }

    this.btnDisable = true;

    const payload = {
      PreCustomerMeetingSid: this.selectedMeeting.PreCustomerMeetingSid,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      PreCustomerMasterSid:
    this.meetingForm.get('preCustomerMasterSid')?.value ||
    this.selectedMeeting.preCustomerMaster?.PreCustomerMasterSid, // ✅ Corrected
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
          this.commonModalService.openSuccessModal(resp.message);
          this.btnDisable = false;
          this.modalRef.close();
          this.loadMeetings(); // Refresh the list
        } else {
          this.btnDisable = false;
          this.commonModalService.openErrorModal(resp.message);
        }
      },
      error => {
        this.btnDisable = false;
        this.commonModalService.openErrorModal("Failed to update meeting. Please try again.");
      }
    );
  }

  viewMeeting(PreCustomerMeetingSid: number) {
    this.router.navigate(['/crm/calendar/update', PreCustomerMeetingSid]);
  }

  createNew() {
    this.router.navigate(['/crm/calendar']);
  }

  getSalesmanById(id: number) {
    if (!id || !this.salesPersons.length) return;

    const user = this.salesPersons.find(person => person.UserMasterSid === id)

    return user?.userName

  }

  resetForm(): void {
    // If editing an existing meeting, reload the original data
    if (this.isEditMode && this.selectedMeeting && this.selectedMeeting.PreCustomerMeetingSid) {
      this.loadMeetingData(this.selectedMeeting.PreCustomerMeetingSid);
      return;
    }

    // Create-mode: reset only modified fields to their original values
    const originalValues = {
      customerName: this.selectedMeeting?.preCustomerMaster?.preCustomerName || '',
      PreCustomerMeetingSid: this.selectedMeeting?.PreCustomerMeetingSid || '',
      meetingDate: this.selectedMeeting?.meetingDate ? this.formatDateForInput(this.selectedMeeting.meetingDate) : '',
      followUpDate: this.selectedMeeting?.followUpDate ? this.formatDateForInput(this.selectedMeeting.followUpDate) : '',
      followUp: !!(this.selectedMeeting?.followUpDate || this.selectedMeeting?.followUpNote),
      meetingType: this.selectedMeeting?.meetingType || '',
      leadAssignTo: this.selectedMeeting?.leadAssignTo || '',
      meetingNote: this.selectedMeeting?.meetingNote || '',
      meetingStatus: this.selectedMeeting?.meetingStatus || 'Scheduled',
      followUpNote: this.selectedMeeting?.followUpNote || ''
    };

    // Patch the form with original values instead of resetting completely
    this.meetingForm.patchValue(originalValues);

    // Reset validation states
    this.meetingForm.markAsPristine();
    this.meetingForm.markAsUntouched();

    // Reset individual control validation states
    Object.keys(this.meetingForm.controls).forEach(key => {
      const control = this.meetingForm.get(key);
      control?.markAsPristine();
      control?.markAsUntouched();
      control?.setErrors(null);
    });

    // Reset button state
    this.btnDisable = false;

    // Note: Removed the loadMeetings() call since we don't want to refresh the entire list
    // when just resetting form modifications
  }

  toggleFollowUp(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.meetingForm.patchValue({ followUp: isChecked });

    // If unchecked, reset followUpDate and followUpNote
    if (!isChecked) {
      this.meetingForm.patchValue({ followUpDate: null, followUpNote: '' });
    }
  }

  showInfo() {
    if (!this.meetingData) return;
    const modalRef = this.modalService.open(DetailsComponent, { size: 'lg', centered: true, backdrop: 'static' });
    modalRef.componentInstance.item = this.meetingData;
    modalRef.componentInstance.idLabel = 'Meeting Id';
    modalRef.componentInstance.idValue = this.meetingData?.PreCustomerMeetingSid;
  }


  openTandC() {
    this.currentMenuId = Number(localStorage.getItem('currentMenuId'));
    const payload = { MenuMasterSid: this.currentMenuId };
    this.leadService.getTandCByCondition(payload).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.TandCList = resp.data;
          const modalRef = this.modalService.open(TermsAndConditionsComponent, {
            size: 'lg',
            backdrop: 'static',
            centered: true
          });
          modalRef.componentInstance.terms = this.TandCList;
          modalRef.componentInstance.MenuMasterSid = this.currentMenuId;
          modalRef.componentInstance.DocumentSid = this.meetingData?.PreCustomerMeetingSid;

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
    if (!this.meetingData) return;
    const modalRef = this.modalService.open(EmailEntryComponent, {
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