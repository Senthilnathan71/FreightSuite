import { Component, EventEmitter, Input, OnChanges, OnInit, Optional, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafeInsertShipmentMilestone, ShipmentMilestoneService } from 'src/app/modules/operation/services/shipment-milestone.service';

@Component({
  selector: 'app-follow-up',
  standalone: true,
  imports: [
    NgSelectModule,
    NgbDatepickerModule,
    FeatherModule,
    FormsModule,
    PreventMultiClickDirective,
    ReactiveFormsModule,
    SearchableDropdown,
    CommonModule
  ],
  templateUrl: './follow-up.component.html',
  styleUrl: './follow-up.component.scss',
   providers: [
          { provide: NgbDateAdapter, useClass: CustomDateAdapter },
          { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
      ],
})
export class FollowUpComponent implements OnInit, OnChanges {
  @Input() parentEmail: string;     
  @Input() parentEmailCC?: string;
  @Input() parentSubject!: string;    
  @Input() parentMailbody!: string;
  @Input() documentSid!: number;
  @Input() screenName: string = "Follow Up";
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: boolean = false;
  @Input() formData: any;
  private _isFormDisabled: boolean = false;
  @Input()
  set isFormDisabled(value: boolean) {
    this._isFormDisabled = value;
    if (this.followupForm) {
      if (this._isFormDisabled) {
        this.followupForm.disable({ emitEvent: false });
      } else {
        this.followupForm.enable({ emitEvent: false });
      }
    }
  }
  get isFormDisabled(): boolean {
    return this._isFormDisabled;
  }
  FollowupSid?: any;

  /**
   * Inputs for auto inserting milestone
   */

  /**
   * Indicates whether the milestone should be auto-inserted or not
   * Decides by checking the department , job type.
   */
  @Input() autoInsertMilestone ?: boolean = false;
  @Input() milestonePayload ?: {
    MilestoneCode: string;
    ShipmentNo: string;
    CompanyMasterSid: number;
    BranchMasterSid: number;
    DepartmentName: string;
    JobType: string;
    createdBy: string;
    Remarks : string;
  };
  /**
   * Output emitted after inserting followup milestone for milestone component to reload
   */
  @Output() reloadMilestone = new EventEmitter<void>();


  // @Output() closeModal = new EventEmitter<boolean>();
  @Output() closeModalEvent = new EventEmitter<boolean>();
  @Output() dataEmitter = new EventEmitter<any>();
  @Output() followupSaved = new EventEmitter<any>();
  today = new Date();
  todayDate = this.toNgbDateStruct(this.today);

  followupForm!: FormGroup;
  @Input() parentMailbodyTemplate: string = '';
  mailBody: string = '';
  subject: string = '';
  isEditMode = false;
  loading = false;
  userData : any;
  usersList: any[] = [];
  userLookupConfig = {
    displayFields: ['userName', 'userEmail'],
    displayLabels: ['Name', 'Email'],
    labelFields: ['userEmail'],
  }
  customerList: any[] = [];
  customerLookupConfig = {
    displayFields: ['CustomerName', 'BranchName' , 'Email'],
    displayLabels: ['Customer', 'Branch', 'Email'],
    labelFields: ['Email'],
  }
  currentCompany : any;
  currentBranch: any;
  showInternalUser = false;
  showExternalUser = false;
  btnDisable: boolean = false;
  selectedFile: File | null = null;
  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];
  modeOfAction = [
    { id: '1', name: 'Internal' },
    { id: '2', name: 'External' },
    { id: '3', name: 'Both'}
  ];

  constructor(
    private fb: FormBuilder,
    // private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService,
    private shipmentMilestoneService : ShipmentMilestoneService,
     @Optional() public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.initForm();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    this.loadLookups();
    if (this.documentSid) {
      this.loadExistingFollowupForDocument();
    }
    this.followupForm.get('FollowupAction')?.valueChanges.subscribe(value => {
      this.updateFieldVisibility(value);
    });
    
    // Set initial visibility
    this.updateFieldVisibility(this.followupForm.get('FollowupAction')?.value);
    this.followupForm.get('Subject')?.valueChanges.subscribe(subject => {
      if (this.parentSubject){
        this.subject = this.parentSubject.replace('__SUBJECT__',subject || '' );
      }
    if (this.parentMailbodyTemplate){
      this.mailBody = this.parentMailbodyTemplate.replace('__SUBJECT__', subject || '');
    }
  });
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['autoInsertMilestone'] &&
      !changes['autoInsertMilestone'].firstChange &&
      changes['autoInsertMilestone'].previousValue !== changes['autoInsertMilestone'].currentValue) {

      this.autoInsertMilestone = changes['autoInsertMilestone'].currentValue;
    }

    if (changes['milestonePayload'] &&
      !changes['milestonePayload'].firstChange &&
      changes['milestonePayload'].previousValue !== changes['milestonePayload'].currentValue) {

      this.milestonePayload = changes['milestonePayload'].currentValue;
    }
  }

  private patchFollowup(followupData: any): void {
  const formData = {
    FollowupRequire: followupData.FollowupRequire ?? 'Y',
    FollowupDate: this.parseDateToNgbStruct(followupData.FollowupDate),
    FollowupAction: followupData.FollowupAction ?? '',
    InternalUser: followupData.InternalUser ?? '',
    ExternalUser: followupData.ExternalUser ?? '',
    Remarks: followupData.Remarks ?? '',
    Public: followupData.Public === 'Y',
    sentEmail: followupData.sentEmail === 'Y',
    Status: followupData.Status === 'A' ? 'Active' : 'Suspended',
    Subject: followupData.Subject ?? ''
  };

  console.log('Patching followup form:', formData);

  this.followupForm.patchValue(formData);
  this.updateFieldVisibility(formData.FollowupAction);
}


    loadExistingFollowupForDocument(): void {
    if (!this.documentSid) return;
    
    this.masterService.getFollowupsByDocumentId(this.documentSid).subscribe({
      next: (response: any) => {
        if (response.status && response.data) {
          const existingFollowup = response.data;
          this.FollowupSid = existingFollowup.FollowupSid;
          this.isEditMode = true;
          this.patchFollowup(existingFollowup); // This will patch the form
        }
      },
      error: (err) => {
        console.error('Failed to load existing followup:', err);
      }
    });
  }


    private handleSaveResponse(resp: any): void {
    if (resp.status) {
      this.appSettingService.showSuccess(resp.message);
      this.closeModal();
    } else {
      this.appSettingService.showError(resp.message);
    }
    this.btnDisable = false;
    this.loading = false;
  }

  updateFieldVisibility(action: string): void {
    switch (action) {
      case 'Internal':
        this.showInternalUser = true;
        this.showExternalUser = false;
        // Clear external user when hidden
        this.followupForm.get('ExternalUser')?.setValue('');
        break;
      case 'External':
        this.showInternalUser = false;
        this.showExternalUser = true;
        // Clear internal user when hidden
        this.followupForm.get('InternalUser')?.setValue('');
        break;
      case 'Both':
        this.showInternalUser = true;
        this.showExternalUser = true;
        break;
      default:
        this.showInternalUser = false;
        this.showExternalUser = false;
        // Clear both fields when no action selected
        this.followupForm.get('InternalUser')?.setValue('');
        this.followupForm.get('ExternalUser')?.setValue('');
        break;
    }
  }

  loadLookups() {
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    if (!CompanyMasterSid) {
    console.error('Company ID not found');
    this.appSettingService.showError('Company information not available');
    return;
    }
    forkJoin({
      users: this.masterService.getAllFfUser(),
      customers: this.masterService.getAllCustomersWithCustomerBranch(CompanyMasterSid)
    }).subscribe(({users , customers}) => {
      this.usersList = users.data;
      this.customerList = customers;
    })
  }
  initForm() {
    this.followupForm = this.fb.group({
      FollowupRequire: ['Y'], 
      FollowupDate: [, Validators.required], 
      FollowupAction: ['', Validators.required], 
      InternalUser: [''],
      ExternalUser:[''],
      Remarks: [''], 
      Public: [false], 
      sentEmail: [false], 
      Status: ['Active', Validators.required], 
      Subject: ['', Validators.required],
    });
  }
  loadFollowup(): void {
    if (!this.documentSid) return;
    this.masterService.getFollowupsByDocumentId(this.documentSid!)
      .subscribe({
        next: (res: any) => {
           if (res.status && res.data) {
          const followupData = res.data; // Get the first followup from array
          this.FollowupSid = followupData.FollowupSid; // Ensure FollowupSid is set
          
          // Map the API response to form values
          const formData = {
            FollowupRequire: followupData.FollowupRequire === 'Y' ? 'Y' : 'N',
            FollowupDate: this.parseDateToNgbStruct(followupData.FollowupDate),
            FollowupAction: followupData.FollowupAction || '',
            InternalUser: followupData.InternalUser || '',
            ExternalUser: followupData.ExternalUser || '',
            Remarks: followupData.Remarks || '',
            Public: followupData.Public === 'Y',
            sentEmail: followupData.sentEmail === 'Y' ,
            Status: followupData.Status === 'A' ? 'Active' : 'Suspended',
            Subject: followupData.Subject || ''
          };
          
          console.log('Patching form with data:', formData);
          this.followupForm.patchValue(formData);
          
          // Trigger visibility update
          this.updateFieldVisibility(formData.FollowupAction);
        }
      },
        error: (err) => {
          console.error('Failed to load followup:', err);
        }
      });
  }
  parseDateToNgbStruct(dateString: string | null): NgbDateStruct | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
}
  async onSave() {
  if (this.btnDisable) return;

  if (this.followupForm.invalid) {
    this.followupForm.markAllAsTouched();
    this.followupForm.updateValueAndValidity();
    this.appSettingService.showWarning('Please fill all required fields correctly.');
    return;
  } else {
    this.btnDisable = true;

    let createdBy = { createdBy: this.appSettingService.userSettingSource.value['userEmail'] };
    let updatedBy = { updatedBy: this.appSettingService.userSettingSource.value['userEmail'] };
    const formValue = this.followupForm.value;
    this.dataEmitter.emit({
  dataItems: this.followupForm.value,  
  formData: this.followupForm.value
});

    const followupCreate = {
      FollowupRequire: formValue.FollowupRequire,
      FollowupDate: formValue.FollowupDate,
      FollowupAction: formValue.FollowupAction,
      InternalUser: formValue.InternalUser,
      ExternalUser: formValue.ExternalUser,
      Remarks: formValue.Remarks,
      Public: formValue.Public,
      sentEmail: formValue.sentEmail,
      Status: formValue.Status === 'Active' ? 'A' : 'S',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
      DocumentSid: this.documentSid,
      Subject: formValue.Subject,
    };
    const emailRecipients = this.getEmailRecipients(formValue);
    let pdfFile: File | null = null;
    if (formValue.Mailbody) {
    pdfFile = await this.generatePdfFromHtml(formValue.Mailbody);
  }

    const mailContent: any = {
      EmailTo: emailRecipients.to,
      EmailCC: emailRecipients.cc,
      Subject: this.subject,
      Mailbody: this.mailBody,
      file: pdfFile
    };

    const payload = (this.isEditMode)
      ? { followupCreate, mailContent, ...updatedBy }
      : { followupCreate, mailContent, ...createdBy, ...updatedBy };

    console.log('Followup Payload:', payload);

    if (this.isEditMode) {
      this.masterService.updateById(this.FollowupSid!, payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            const isCargoInvolved = followupCreate.FollowupAction === 'External' && this.subject.toLowerCase().includes('cargo');
            if (isCargoInvolved && this.autoInsertMilestone) {
              this.handleAutoInsertMilestone();
            }
            this.activeModal.close(resp);
          } else {
            this.appSettingService.showError(resp.message);
          }
          this.btnDisable = false;
        },
        (error) => {
          console.error('Update Followup Error:', error);
          this.appSettingService.showError(error.message);
          this.btnDisable = false;
        }
      );
    } else {
      this.masterService.createFollowup(payload).subscribe(
        (resp: any) => {
          if (resp.status) {
            this.appSettingService.showSuccess(resp.message);
            const isCargoInvolved = followupCreate.FollowupAction === 'External' && this.subject.toLowerCase().includes('cargo');
            console.log('Is cargo involved?', {
              subject : this.subject,
              contains : this.subject.toLowerCase().includes('cargo'),
              FollowupAction : followupCreate.FollowupAction,
              IsExternal : followupCreate.FollowupAction === 'External',
              isCargoInvolved
            });
            if(isCargoInvolved && this.autoInsertMilestone){
              this.handleAutoInsertMilestone()
            }
            this.activeModal.close(resp);
          } else {
            this.appSettingService.showError(resp.message);
          }
          this.btnDisable = false;
        },
        (error) => {
          console.error('Create Followup Error:', error);
          this.appSettingService.showError(error.message);
          this.btnDisable = false;
        }
      );
    }
  }
}

handleAutoInsertMilestone(){
  console.log("payload from parent",this.milestonePayload);
  const milestoneDate = this.getMilestoneDateFromFollowup();
  const payload : SafeInsertShipmentMilestone = {
    CompanyMasterSid: this.milestonePayload?.CompanyMasterSid || this.currentCompany?.CompanyMasterSid,
    BranchMasterSid: this.milestonePayload?.BranchMasterSid || this.currentBranch?.BranchMasterSid,
    DepartmentName: this.milestonePayload?.DepartmentName,
    JobType: this.milestonePayload?.JobType,
    MilestoneCode: this.milestonePayload?.MilestoneCode,
    ShipmentNo: this.milestonePayload?.ShipmentNo,
    MilestoneDate: milestoneDate || undefined,
    createdBy : this.milestonePayload?.createdBy,
    Remarks : this.milestonePayload?.Remarks
  }
  this.shipmentMilestoneService.safeInsertMilestone(payload).subscribe({
    next: (resp) => {
      if (resp.status) {
        this.appSettingService.showSuccess(resp.message);
        this.reloadMilestone.emit();
      } else {
        this.appSettingService.showError(resp.message);
      }
    },
    error: (error) => {
      console.error('Error inserting milestone:', error);
      this.appSettingService.showError(error.message);
    }
  });
}

private getMilestoneDateFromFollowup(): Date | null {
  const followupDate = this.followupForm?.get('FollowupDate')?.value;
  if (!followupDate) return null;

  if (followupDate instanceof Date) {
    return isNaN(followupDate.getTime()) ? null : followupDate;
  }

  if (typeof followupDate === 'string') {
    const parsed = new Date(followupDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (
    typeof followupDate === 'object' &&
    'year' in followupDate &&
    'month' in followupDate &&
    'day' in followupDate
  ) {
    const parsed = new Date(followupDate.year, followupDate.month - 1, followupDate.day);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}



private getEmailRecipients(formValue: any): { to: string, cc: string } {
  const currentUserEmail = this.appSettingService.userSettingSource.value['userEmail'];
  let emailTo = '';
  let emailCC = currentUserEmail; // Always CC the current user

  console.log('=== EMAIL RECIPIENT DEBUG ===');
  console.log('Current User:', currentUserEmail);
  console.log('Followup Action:', formValue.FollowupAction);
  console.log('Internal User Selected:', formValue.InternalUser);
  console.log('External User Selected:', formValue.ExternalUser);
  console.log('Send Email Checkbox:', formValue.sentEmail);
  switch (formValue.FollowupAction) {
    case 'Internal':
      emailTo = formValue.InternalUser || '';
      console.log('Internal Followup - Email To:', emailTo);
      break;
    
    case 'External':
      emailTo = formValue.ExternalUser || '';
      console.log('External Followup - Email To:', emailTo);
      break;
    
    case 'Both':
      const internalUser = formValue.InternalUser || '';
      const externalUser = formValue.ExternalUser || '';
      emailTo = [internalUser, externalUser].filter(email => email && email.trim() !== '').join(', ');
      console.log('Both - Email To:', emailTo);
      break;
    
    default:
      emailTo = '';
      console.log('Default - No email recipients');
      break;
  }

  if (this.parentEmailCC) {
    const ccEmails = this.parentEmailCC.split(',').map(email => email.trim());
    ccEmails.forEach(ccEmail => {
      if (ccEmail && ccEmail !== currentUserEmail && ccEmail !== emailTo && !emailCC.includes(ccEmail)) {
        emailCC += (emailCC ? ', ' : '') + ccEmail;
      }
    });
  }

  console.log('FINAL - Email To:', emailTo);
  console.log('FINAL - Email CC:', emailCC);
  console.log('=== END DEBUG ===');

  return { to: emailTo, cc: emailCC };
}
private async generatePdfFromHtml(html: string): Promise<File> {
  const element = document.createElement('div');
  element.innerHTML = html;
  element.style.position = 'fixed';
  element.style.left = '-9999px';
  document.body.appendChild(element);

  const canvas = await html2canvas(element); // capture HTML as canvas
  const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

  const pdfBlob = pdf.output('blob');
  document.body.removeChild(element);

  return new File([pdfBlob], 'Followup.pdf', { type: 'application/pdf' });
}


   resetform(): void {
    this.followupForm.reset({
      FollowupRequire: '',
      FollowupDate: null,
      FollowupAction: '',
      InternalUser: '',
      ExternalUser: '',
      Remarks: '',
      Public: '',
      sentEmail: '',
      Status: 'Active'
    });
  }

  toNgbDateStruct(date: Date | null): NgbDateStruct | null {
    if (!date) return null;
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }

  // closeModal(): void {
  //   // this.activeModal.dismiss();
  // }

   closeModal() {
    if (this.activeModal) {
      this.activeModal.close();  // Closes Bootstrap modal
    } else {
      this.closeModalEvent.emit(true); // Notify parent if no modal
    }
  }
}
