import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
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
    DateTimePickerComponent
  ],
  templateUrl: './meeting.component.html',
  styleUrl: './meeting.component.scss'
})
export class MeetingComponent {
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
  selectedTime = '10 min';
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
    console.log(payload, "PAYLOAD")
    this.leadService.createPreCustomerMeeting(payload).subscribe(
      resp => {
        if (resp.data && resp.status) {
          // this.appSettingService.showSuccess(resp.message);
          this.modalService.openSuccessModal(resp.message);
          this.btnDisable = false;
          this.meetingForm.patchValue(resp.data);
          this.router.navigate([`/crm/lead-schedule-pending`]);

        } else {
          // this.appSettingService.showError(resp.message);
          this.modalService.openErrorModal(resp.message);
        }
      }
    )
    console.log('Creating Lead:', payload);
    this.btnDisable = false;
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

  resetForm() {
    // Get a list of all form controls
    const controls = this.meetingForm.controls;

    // Loop through the controls and reset only the editable ones
    Object.keys(controls).forEach(key => {
      const control = controls[key];

      // Check if the control is disabled, if not, reset its value
      if (!control.disabled) {
        control.reset(); // Reset only editable controls
      }
    });

    // You can also reset the form state (pristine, touched, etc.) if needed
    this.meetingForm.markAsPristine();
    this.meetingForm.markAsUntouched();
  }

  goBack() {
    history.back()
  }


  openAuditLogs(modal: TemplateRef<any>) {
    if (!this.PreCustomerMasterSid) return;

    this.masterService.getAuditLogsChargeGroups('ChargeGroup', this.PreCustomerMasterSid.toString()).subscribe({
      next: (logs: any[]) => {
        const formatFields = (val: any) => {
          if (!val) return ['NA'];
          const obj = typeof val === 'string' ? JSON.parse(val) : val;
          delete obj.updatedOn; // Remove updatedOn field
          // If no fields exist after deleting updatedOn
          if (Object.keys(obj).length === 0) return ['NA'];
          return Object.entries(obj).map(
            ([key, value]) => `${key}: ${value !== null && value !== undefined ? value : 'NA'}`
          );
        };

        this.auditLogs = logs.map(log => ({
          ...log,
          oldValDisplay: formatFields(log.oldVal),
          newValDisplay: formatFields(log.newVal)
        }));

        this.auditLogModalRef = this.ngbModal.open(modal, { centered: true, scrollable: true, windowClass: 'audit-log-modal' });
      },
      error: err => console.error('Error fetching audit logs:', err)
    });
  }


}

