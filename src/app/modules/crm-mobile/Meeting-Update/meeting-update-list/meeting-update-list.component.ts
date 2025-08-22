import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { FeatherModule } from 'angular-feather';
import { NgbModal, NgbModalRef, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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

@Component({
  selector: 'app-meeting-update-list',
  standalone: true,
  imports: [
    CommonModule,
    FeatherModule,
    NgbPaginationModule,
    FormsModule,
    ReactiveFormsModule,
    PreventMultiClickDirective
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
  totalLengthOfCollection: number = 0;
  searchText: string = '';
  isMobile: boolean = false;
  modalRef: NgbModalRef;
  meetingForm: FormGroup;
  salesPersons: any[]=[];
  btnDisable: boolean = false;
  selectedMeeting: any;
  meetingData : any;
  currentMenuId: number;
  TandCList: any;
  currentCompany: any;
  currentBranch:any;

  constructor(
    private router: Router,
    private appService: AppService,
    private appSettingService: AppSettingsService,
    private leadService: LeadService,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private commonModalService: ModalService,
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
      PreCustomerMeetingid: [''],
      meetingDate: ['', Validators.required],
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
    const BranchMasterSid = this.currentCompany?.BranchMasterSid;
    this.leadService.getAllPreCustomerMeetings(CompanyMasterSid,BranchMasterSid).subscribe(
      (resp: any) => {
        if (resp.status && resp.data.length) {
          // Filter meetings to only include specified statuses
          this.meetings = resp.data
            .filter((meeting: any) => 
              meeting.meetingStatus === 'scheduled' || 
              meeting.meetingStatus === 'pending' || 
              meeting.meetingStatus === 'on hold'
            )
            .map((meeting: any) => {
              const salesPerson = this.salesPersons?.find(
                (person: any) => person.UserMasterSid === meeting.leadAssignTo
              );
              return {
                id: meeting.PreCustomerMeetingSid,
                customerName: meeting.preCustomerMaster?.preCustomerName || 'N/A',
                meetingType: meeting.meetingType || 'N/A',
                meetingDate: meeting.meetingDate,
                salesPerson: salesPerson?.userName || 'N/A',
                leadAssignTo: meeting.leadAssignTo,
                status: meeting.meetingStatus === 'scheduled' ? 'Scheduled' :
                        meeting.meetingStatus === 'pending' ? 'In Progress' :
                        meeting.meetingStatus === 'on hold' ? 'On Hold' : 'N/A',
                meetingStatus: meeting.meetingStatus,
                preCustomerMaster: meeting.preCustomerMaster,
                userMaster: meeting.userMaster,
                followUp: meeting.followUpDate || meeting.followUpNote,
                followUpDate: meeting.followUpDate,
                followUpNote: meeting.followUpNote,
                meetingNote: meeting.meetingNote,
                createdBy : meeting.createdBy,
                createdOn : meeting.createdOn,
                updatedBy : meeting.updatedBy,
                updatedOn : meeting.updatedOn
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
          meeting.status.toLowerCase().includes(searchQuery)
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
    this.loadMeetingData(meeting.id);
    this.modalRef = this.modalService.open(content, { size: 'lg' });
  }

  loadMeetingData(meetingId: number) {
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
          PreCustomerMeetingid: meeting.PreCustomerMeetingSid,
          meetingDate: meetingDate,
          meetingType: meeting.meetingType,
          leadAssignTo: meeting.leadAssignTo,
          meetingNote: meeting.meetingNote,
          meetingStatus: meeting.meetingStatus || 'scheduled',
          followUp: followUp,
          followUpDate: followUp ? followUpDate : '',
          followUpNote: followUp ? meeting.followUpNote || '' : ''
        });

        // Disable fields that shouldn't be edited
        this.meetingForm.get('customerName').disable();
        this.meetingForm.get('meetingDate').disable();
        this.meetingForm.get('meetingType').disable();
        this.meetingForm.get('leadAssignTo').disable();

        // Enable status field unless it's confirmed
        this.meetingForm.controls['meetingStatus'].enable();
        if (meeting.meetingStatus === 'confirmed') {
          this.meetingForm.controls['meetingStatus'].disable();
        }
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
      PreCustomerMeetingSid: this.selectedMeeting.id,
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

  viewMeeting(id: number) {
    this.router.navigate(['/crm/calendar/update', id]);
  }

  createNew() {
    this.router.navigate(['/crm/calendar']);
  }

  getSalesmanById(id:number){
    if(!id || !this.salesPersons.length) return;
    
    const user = this.salesPersons.find(person => person.UserMasterSid === id)
    
    return user?.userName
 
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
    modalRef.componentInstance.idValue = this.meetingData?.id;
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
            modalRef.componentInstance.DocumentSid = this.meetingData?.id;
  
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