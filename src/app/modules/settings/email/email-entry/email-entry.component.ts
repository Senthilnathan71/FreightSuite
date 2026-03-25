import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { LogoService } from 'src/app/core/services/logo.service';
import { SettingsService } from '../../settings.service';

@Component({
  selector: 'app-email-entry',
  standalone: true,
  imports: [NgSelectModule, FeatherModule, ReactiveFormsModule, CommonModule, NgxSpinnerModule],
  templateUrl: './email-entry.component.html',
  styleUrl: './email-entry.component.scss',
})
export class EmailEntryComponent implements OnInit {
  emailForm: FormGroup;
  emailSending: boolean;
  parentMailContent: any;
  pendingPatchData: any = null;
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: any;
  @Input() formData: any;
  @Input()
  set setContent(value: any) {
    this.parentMailContent = value;
    if (value) {
      if (this.emailForm) {
        this.patchFormData(value);
      } else {
        this.pendingPatchData = value;
      }
    }
  }
  @Output() dataChange = new EventEmitter<any>();

  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  selectedFiles: File[] = [];
  userData: any;
  currentCompany: any;
  currentBranch: any;
  private reportLogoSrc = '';

  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private settingsService: SettingsService,
    private activeModal: NgbActiveModal,
    private spinner: NgxSpinnerService,
    public logoService: LogoService
  ) {
    this.initMailForm();
  }

  ngOnInit(): void {
    if (this.pendingPatchData) {
      this.patchFormData(this.pendingPatchData);
      this.pendingPatchData = null;
    }

    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    const userProfile = this.appSettingService.getDecryptedUserProfile();
    if (userProfile) {
      this.userData = userProfile;
    }

    this.resolveCurrentCompanyContext();
    this.reportLogoSrc = this.getReportLogoSrc();
  }

  patchFormData(value: any) {
    this.emailForm.patchValue({
      EmailTo: Array.isArray(value.EmailTo) ? value.EmailTo.join(', ') : value.EmailTo || '',
      EmailCC: Array.isArray(value.EmailCC) ? value.EmailCC.join(', ') : value.EmailCC || '',
      EmailBCC: Array.isArray(value.EmailBCC) ? value.EmailBCC.join(', ') : value.EmailBCC || '',
      Subject: value.Subject || '',
      Mailbody: value.Mailbody || '',
    });

    if (value.attachments) {
      this.selectedFiles = value.attachments;
    }
  }

  initMailForm() {
    this.emailForm = this.fb.group({
      EmailTo: [
        '',
        [Validators.required, EmailValidators.multipleEmails(), Validators.maxLength(200)],
      ],
      EmailCC: ['', [EmailValidators.multipleEmails(), Validators.maxLength(200)]],
      EmailBCC: ['', [EmailValidators.multipleEmails(), Validators.maxLength(200)]],
      Subject: ['', [Validators.required, Validators.maxLength(500)]],
      Mailbody: ['', [Validators.required, Validators.maxLength(2000)]],
    });
  }

  closeModal() {
    this.activeModal.close();
  }

  resetForm() {
    this.emailForm.reset();
    this.selectedFiles = [];
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      this.selectedFiles = [...this.selectedFiles, ...files];
      input.value = '';
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formData'] && changes['formData'].currentValue) {
      this.patchFormData(changes['formData'].currentValue);
    }

    if (changes['resetTrigger'] && changes['resetTrigger'].currentValue) {
      this.resetForm();
    }
  }

  saveForm() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.emailForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill the required fields correctly');
      return;
    }

    this.emailSending = true;
    const formValue = this.emailForm.value;
    this.spinner.show();

    const companyMasterSid = this.currentCompany?.CompanyMasterSid;
    const branchMasterSid = this.currentBranch?.BranchMasterSid;
    const userEmail = this.userData.userEmail;

    const formData = new FormData();
    formData.append('CompanyMasterSid', companyMasterSid.toString());
    formData.append('BranchMasterSid', branchMasterSid.toString());
    formData.append('EmailTo', formValue.EmailTo);
    formData.append('EmailCC', formValue.EmailCC || '');
    formData.append('EmailBCC', formValue.EmailBCC || '');
    formData.append('Subject', formValue.Subject);
    formData.append(
      'Mailbody',
      this.buildHeaderTemplate() +
        `<pre style="min-height:400px;padding:2rem;margin:0;font-family:system-ui,sans-serif;font-size:1rem;line-height:1.6;white-space:pre-wrap;background:#f9f9f9;border-radius:4px">${formValue.Mailbody}</pre>` +
        this.buildFooterTemplate()
    );
    formData.append('CreatedBy', userEmail);

    this.selectedFiles.forEach((file) => {
      formData.append('attachments', file, file.name);
    });

    this.settingsService.createNewEmailLog(formData).subscribe(
      (resp: any) => {
        if (resp.status) {
          this.emailSending = false;
          this.appSettingService.showSuccess('Email Log created successfully.');
          this.spinner.hide();
          this.dataChange.emit({
            dataItems: this.dataItems,
            formData: this.emailForm.value,
          });
          this.closeModal();
        } else {
          this.emailSending = false;
          this.spinner.hide();
          this.appSettingService.showError('Email Log creation error.');
        }
      },
      (error) => {
        this.emailSending = false;
        this.spinner.hide();
        this.appSettingService.showError('Email Log creation error: ' + error.message);
      }
    );
  }

  customEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const email = control.value?.trim();

      if (!email) return null;

      const emailPattern = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
      return emailPattern.test(email) ? null : { emailInvalid: true };
    };
  }

  clearFiles() {
    this.selectedFiles = [];
  }

  downloadFile(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  sendMail() {
    if (this.emailForm.valid) {
      this.emailForm.reset();
      this.selectedFiles = [];
      this.closeModal();
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      for (const file of Array.from(event.dataTransfer.files)) {
        this.selectedFiles.push(file);
      }
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  ngAfterViewInit() {
    const textarea = document.querySelector('textarea[formControlName="Mailbody"]') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  private resolveCurrentCompanyContext(): void {
    this.currentCompany =
      ((this.userData?.userCompanyMaster || []).find(
        (ucm: any) => ucm.CompanyMasterSid === this.currentCompany?.CompanyMasterSid
      ))?.companyMaster || this.currentCompany;

    this.currentBranch =
      ((this.currentCompany?.userBranchMaster || []).find(
        (ubm: any) => ubm.BranchMasterSid === this.currentBranch?.BranchMasterSid
      ))?.branchMaster || this.currentBranch;
  }

  private getReportLogoSrc(): string {
    const reportLogo = localStorage.getItem('current_report_logo');
    if (reportLogo && reportLogo.startsWith('data:')) {
      return reportLogo;
    }

    const companyLogo = localStorage.getItem('current_company_logo');
    if (companyLogo && companyLogo.startsWith('data:')) {
      return companyLogo;
    }

    return '';
  }

  private buildHeaderTemplate(): string {
    const companyName = this.currentCompany?.companyName || 'Company Name';
    const branchName = this.currentBranch?.branchName || '';
    const logoHtml = this.reportLogoSrc
      ? `<img src="${this.reportLogoSrc}" alt="${companyName}" style="width:auto;height:56px;max-width:180px;margin-right:12px;display:block;">`
      : '';

    return `
      <div style="background:#fff;padding:16px 20px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${logoHtml}
          <div style="color:#05608D;">
            <div style="font-size:22px;font-weight:700;line-height:1.2;">${companyName}</div>
            ${branchName ? `<div style="font-size:14px;font-weight:600;line-height:1.4;">${branchName}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private buildFooterTemplate(): string {
    return `
      <div style="background:#f5f7fb;padding:6px 22px 14px 22px">
        <div style="
          max-width:640px;
          margin:0 auto;
          background:#05608D;
          color:#fff;
          text-align:center;
          padding:12px 16px;
          border-radius:14px;
          font-size:13px;
        ">
          <div style="margin-bottom:8px">
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Terms</a>
            <span>|</span>
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Privacy</a>
            <span>|</span>
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Contact</a>
            <span>|</span>
            <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Unsubscribe</a>
          </div>
          <div style="opacity:0.8">
            Â© ${new Date().getFullYear()} Dofi Infosys. All rights reserved.
          </div>
        </div>
      </div>
    `;
  }
  
}
