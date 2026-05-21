import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { DROPDOWN_CONFIGS } from 'src/app/common/lookup-config';
import { DateTimePickerComponent } from 'src/app/component/datetimepicker/datetimepicker.component';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';
import { SalespersonInfo } from '../../../interfaces/sales-manager-dashboard.interfaces';

@Component({
  selector: 'app-sm-create-meeting-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, DateTimePickerComponent, SearchableDropdown],
  templateUrl: './sm-create-meeting-modal.component.html'
})
export class SmCreateMeetingModalComponent implements OnInit {
  @Input() lead: any;
  @Input() salespersons: SalespersonInfo[] = [];

  meetingForm!: FormGroup;
  customers: any[] = [];
  leadList: any[] = [];
  btnDisable = false;

  readonly meetingDurations = [
    { label: '10 min', value: '10 min' },
    { label: '20 min', value: '20 min' },
    { label: '30 min', value: '30 min' },
    { label: '40 min', value: '40 min' },
    { label: '50 min', value: '50 min' },
    { label: '1 hr', value: '1 hr' }
  ];

  readonly userLookupConfig = DROPDOWN_CONFIGS.USER;

  private currentCompany: any;
  private currentBranch: any;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private leadService: LeadService,
    private appSettings: AppSettingsService
  ) {}

  ngOnInit(): void {
    const storedCompany = localStorage.getItem('selected-company');
    const storedBranch = localStorage.getItem('selected-branch');

    this.currentCompany = storedCompany ? this.appSettings.decrypt(storedCompany) : null;
    this.currentBranch = storedBranch ? this.appSettings.decrypt(storedBranch) : null;

    this.initForm();
    this.loadCustomers();
    this.loadLeads();
    this.prefillLeadContext();
  }

  get f(): { [key: string]: AbstractControl<any, any> } {
    return this.meetingForm.controls;
  }

  private initForm(): void {
    this.meetingForm = this.fb.group({
      LeadOrCustomer: ['L', Validators.required],
      customerName: [''],
      CustomerMasterSid: [null],
      PreCustomerMasterSid: [null],
      meetingDate: ['', Validators.required],
      followUpDate: [''],
      followUp: [false],
      meetingType: ['', Validators.required],
      leadAssignTo: [null, Validators.required],
      meetingNote: ['', Validators.required],
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
      } else {
        customer?.setValidators([Validators.required]);
        preCustomer?.clearValidators();
        preCustomer?.setValue(null);
      }

      preCustomer?.updateValueAndValidity();
      customer?.updateValueAndValidity();
    });

    this.meetingForm.get('followUp')?.valueChanges.subscribe(() => {
      this.updateFollowUpValidators();
    });

    this.meetingForm.get('LeadOrCustomer')?.setValue(this.meetingForm.get('LeadOrCustomer')?.value);
  }

  private loadCustomers(): void {
    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!companyMasterSid) {
      return;
    }

    this.leadService.getAllCustomers(companyMasterSid).subscribe(resp => {
      this.customers = resp || [];
    });
  }

  private loadLeads(): void {
    if (!this.currentCompany?.CompanyMasterSid || !this.currentBranch?.BranchMasterSid) {
      return;
    }

    this.leadService.fetchAllLeads({
      CompanyMasterSid: this.currentCompany.CompanyMasterSid,
      BranchMasterSid: this.currentBranch.BranchMasterSid
    }).subscribe((resp: any) => {
      this.leadList = resp?.data || [];
    });
  }

  private prefillLeadContext(): void {
    if (!this.lead?.PreCustomerMasterSid) {
      return;
    }

    this.meetingForm.patchValue({
      LeadOrCustomer: 'L',
      PreCustomerMasterSid: this.lead.PreCustomerMasterSid
    });

    this.meetingForm.get('LeadOrCustomer')?.disable();
    this.meetingForm.get('PreCustomerMasterSid')?.disable();
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

  toggleFollowUp(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.meetingForm.get('followUp')?.setValue(isChecked);
  }

  onSubmit(): void {
    this.updateFollowUpValidators();

    if (this.meetingForm.invalid) {
      this.meetingForm.markAllAsTouched();
      return;
    }

    const rawValue = this.meetingForm.getRawValue();

    this.activeModal.close({
      PreCustomerMasterSid: rawValue.LeadOrCustomer === 'L' ? rawValue.PreCustomerMasterSid : null,
      leadAssignTo: rawValue.leadAssignTo,
      meetingDate: rawValue.meetingDate,
      meetingType: rawValue.meetingType,
      meetingNote: rawValue.meetingNote,
      ...(rawValue.followUp && rawValue.followUpDate ? { followUpDate: rawValue.followUpDate } : {}),
      ...(rawValue.followUp && rawValue.followUpNote ? { followUpNote: rawValue.followUpNote } : {})
    });
  }
}
