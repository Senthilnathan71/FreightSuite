import { Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { MasterService } from 'src/app/modules/master/master.service';
import { SettingsService } from '../../settings.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { EmailValidators } from 'src/app/core/ValidationFn/email.validators';

@Component({
  selector: 'app-email-entry',
  standalone: true,
  imports: [NgSelectModule, FeatherModule, ReactiveFormsModule, CommonModule],
  templateUrl: './email-entry.component.html',
  styleUrl: './email-entry.component.scss'
})
export class EmailEntryComponent implements OnInit {
  emailForm: FormGroup;
  emailSending : boolean;
  // @Input('DocumentSid') DocumentSid : number;

  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  selectedFiles: File[] = [];
  userData: any;
   // Company
  currentCompany : any;
  currentBranch : any;
  private headerTemplate = `
  <div style="background:#fff;padding:1rem;border-bottom:1px solid #eee">
    <a href="#" style="display:inline-flex;align-items:center;text-decoration:none;color:#05608D;font-weight:600;font-size:1.25rem">
      <img src="assets/logo/dofi-logo.svg" alt="Dofi Infosys" style="width:40px;height:40px;margin-right:8px">
      Dofi Infosys
    </a>
  </div>
`;

private footerTemplate = `
  <div style="background:#05608D;color:#fff;text-align:center;padding:0.75rem;font-size:0.875rem">
    <div style="margin-bottom:0.5rem">
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Terms</a>|
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Privacy</a>|
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Contact</a>|
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Unsubscribe</a>
    </div>
    <p style="margin:0">© ${new Date().getFullYear()} Dofi Infosys</p>
  </div>
`;

  constructor(
    private fb: FormBuilder,
    private appSettingService: AppSettingsService,
    private settingsService: SettingsService,
    private activeModal: NgbActiveModal
  ) {
  }

  ngOnInit(): void {
    this.initMailForm();
    // this.appSettingService.getUser().subscribe(
    //   (resp: any) => {
    //     this.userData = resp;
    //   }
    // )
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
  }

  // initMailForm() {
  //   this.emailForm = this.fb.group({
  //     EmailTo: ['', [Validators.required, EmailValidators.multipleEmails()]],
  //     EmailCC: ['', [EmailValidators.multipleEmails()]],
  //     Subject: ['',[Validators.maxLength(500)]],
  //     Mailbody: ['',[Validators.maxLength(2000)]]
  //   });
  // }

  initMailForm() {
  this.emailForm = this.fb.group({
    EmailTo: [
      '',
      [
        Validators.required,
        EmailValidators.multipleEmails(),
        Validators.maxLength(200)   // length limit
      ]
    ],
    EmailCC: [
      '',
      [
        EmailValidators.multipleEmails(),
        Validators.maxLength(200)
      ]
    ],
    EmailBCC: [
      '',
      [
        EmailValidators.multipleEmails(),
        Validators.maxLength(200)
      ]
    ],
    Subject: [
      '',
      [
        Validators.required,
        Validators.maxLength(500)
      ]
    ],
    Mailbody: [
      '',
      [
        Validators.required,
        Validators.maxLength(2000)
      ]
    ]
  });
}


  closeModal() {
    console.log('Modal closed');
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

  // removeFile(file: File) {
  //   this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  // }

    removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  saveForm() {
    if(this.emailForm.invalid){
      this.emailForm.markAllAsTouched();
      this.emailForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill the required fields correctly');
      return;
    }
    this.emailSending = true;
    const CompanyMasterSid = this.currentCompany?.CompanyMasterSid;
    const BranchMasterSid = this.currentBranch?.BranchMasterSid;
    const userEmail = this.userData.userEmail;

    const formValue = this.emailForm.value;

    const payload = {
      CompanyMasterSid: CompanyMasterSid,
      BranchMasterSid: BranchMasterSid,
      EmailTo: formValue.EmailTo,
      EmailCC: formValue.EmailCC,
      Subject: formValue.Subject,
      Mailbody: this.headerTemplate + `<pre style="min-height:400px;padding:2rem;margin:0;font-family:system-ui,sans-serif;font-size:1rem;line-height:1.6;white-space:pre-wrap;background:#f9f9f9;border-radius:4px">${formValue.Mailbody}</pre>` + this.footerTemplate,
      CreatedBy: userEmail
    }
    console.log(payload);

    this.settingsService.createNewEmailLog(payload).subscribe(
      (resp: any) => {
        if (resp.status) {    
          this.emailSending = false;
          this.appSettingService.showSuccess('Email Log created successfully.')
          this.closeModal()
        } else {
          this.emailSending = false;
          this.appSettingService.showError('Email Log creation error.')
        }
      }
    )

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
      console.log("Mail Sent ✅", this.emailForm.value, this.selectedFiles);
      this.emailForm.reset();
      this.selectedFiles = [];
      this.closeModal();
    }
  }

  

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      for (let file of Array.from(event.dataTransfer.files)) {
        this.selectedFiles.push(file);
      }
    }
  }

   onDragOver(event: DragEvent) {
    event.preventDefault();
  }
}