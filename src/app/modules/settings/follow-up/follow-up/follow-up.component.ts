import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { PreventMultiClickDirective } from 'src/app/core/Directives/prevent-multi-click.directive';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  ],
  templateUrl: './follow-up.component.html',
  styleUrl: './follow-up.component.scss',
   providers: [
          { provide: NgbDateAdapter, useClass: CustomDateAdapter },
          { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
      ],
})
export class FollowUpComponent implements OnInit {
  @Input() parentEmail: string;      
  @Input() parentEmailCC?: string;
  @Input() parentSubject!: string;     // Subject
  @Input() parentMailbody!: string;
  followupForm!: FormGroup;
  FollowupSid: number;
  isEditMode = false;
  loading = false;
  userData : any;
  currentCompany : any;
  currentBranch: any;
  btnDisable: boolean = false;
  selectedFile: File | null = null;
  modeOfStatus = [
    { id: 'A', name: 'Active' },
    { id: 'S', name: 'Suspended' },
  ];

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private appSettingService: AppSettingsService,
    private masterService: MasterService
  ) {}

  ngOnInit(): void {
    this.initForm();
    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }
    const storedCompany = localStorage.getItem('selected-company');
    this.currentCompany = storedCompany ? this.appSettingService.decrypt(storedCompany) : null;
    const storedBranch = localStorage.getItem('selected-branch');
    this.currentBranch = storedBranch ? this.appSettingService.decrypt(storedBranch) : null;
  }

  initForm() {
    this.followupForm = this.fb.group({
      FollowupRequire: [''], 
      FollowupDate: [, Validators.required], 
      FollowupAction: ['', Validators.required], 
      Remarks: [''], 
      Public: [''], 
      sentEmail: [''], 
      Status: ['A', Validators.required], 
    });
    if (this.FollowupSid) {
      this.isEditMode = true;
      this.loadFollowup();
    }
  }
  loadFollowup(): void {
    this.masterService.getFollowById(this.FollowupSid!)
      .subscribe({
        next: (res) => {
          this.followupForm.patchValue(res);
        },
        error: (err) => {
          console.error('Failed to load followup:', err);
        }
      });
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

    const followupCreate = {
      FollowupRequire: formValue.FollowupRequire,
      FollowupDate: formValue.FollowupDate,
      FollowupAction: formValue.FollowupAction,
      Remarks: formValue.Remarks,
      Public: formValue.Public,
      sentEmail: formValue.sentEmail,
      Status: formValue.Status === 'A' ? 'A' : 'S',
      CompanyMasterSid: this.currentCompany?.CompanyMasterSid,
      BranchMasterSid: this.currentBranch?.BranchMasterSid,
    };
    let pdfFile: File | null = null;
  if (formValue.Mailbody) {
    pdfFile = await this.generatePdfFromHtml(formValue.Mailbody);
  }

    const mailContent: any = {
      EmailTo: this.parentEmail,
      EmailCC: this.appSettingService.userSettingSource.value['userEmail'],
      Subject: this.parentSubject,
      Mailbody: this.parentMailbody,
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
      Remarks: '',
      Public: '',
      sentEmail: '',
      Status: 'Active'
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
}
