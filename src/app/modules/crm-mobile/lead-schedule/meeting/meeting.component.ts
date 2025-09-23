import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { FeatherModule } from 'angular-feather';
import { ActivatedRoute, Router } from '@angular/router';
import { LeadService } from '../../Services/lead.service';
import { ModalService } from 'src/app/core/common-modal/common-modal.service';

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FeatherModule
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
  minDate: string = '';
  currentCompany : any;
  currentBranch : any;
  userData : any;


  constructor(
    private fb: FormBuilder,
    private leadService: LeadService,
    private appSettingService: AppSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: ModalService
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
    return now.toISOString().slice(0, 16); // Format as 'YYYY-MM-DDTHH:mm'
  }

  // Method to load the city data
  loadSalesPerson(): void {
    this.leadService.getAllSalesPerson().subscribe(
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
      customerProfile: ['', Validators.required]
    });

    this.meetingForm.get('customerName')?.disable();
    this.meetingForm.get('contactPerson')?.disable();
    this.meetingForm.get('phone')?.disable();
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    this.meetingForm.controls['status'].disable();
    return this.meetingForm.controls;
  }



  // Handle Form Submission
  onSubmit() {
    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched(); // Force validation messages to show
      this.meetingForm.updateValueAndValidity(); // Ensure validation is refreshed
      this.appSettingService.showWarning('Please fill all required fields correctly.')
      return;
    }
    this.meetingForm.get('customerName')?.enable();
    this.meetingForm.get('contactPerson')?.enable();
    this.meetingForm.get('phone')?.enable();
    this.meetingForm.get('status')?.enable();
    const payload = {
      ...this.meetingForm.value,
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      createdBy : this.userData?.userEmail,
      LeadOrCustomer : 'L',
      PreCustomerMasterSid: this.PreCustomerMasterSid
    };
    this.btnDisable = true;
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
    this.leadService.getPrecustomerById(leadId).subscribe(
      (leadData) => {
        // console.log(leadData, 'leadData')
        this.lead = leadData
        this.lead.status = this.lead.status === "A" ? "Active" : "Suspend";
        if (this.lead) {
          this.meetingForm.patchValue({
            customerName: this.lead.preCustomerName || '',
            contactPerson: this.lead.contactPerson || '',
            phone: this.lead.phone || '',
            status: this.lead.status || ''
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

}

