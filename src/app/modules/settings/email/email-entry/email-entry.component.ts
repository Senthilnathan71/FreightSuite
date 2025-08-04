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

  private headerTemplate = `<div style="background:white;padding:1.5rem;text-align:center;border-bottom:1px solid #eee;display:grid;place-items:center"><a href="#" style="display:flex;align-items:center;gap:1rem;text-decoration:none"><img src="https://dofiinfosys.com/wp-content/uploads/2024/04/cropped-Untitled-1.png" style="width:50px;height:50px;padding-right:10px"><span style="font-size:1.5rem;font-weight:600;color:#05608D">Dofi Infosys</span></a></div>`;

  private footerTemplate = `<div style="color:white;border-top:1px solid #dee2e6;text-align:center;background:#05608D;padding:1rem"><div style="display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:0.5rem 1rem;margin:0 auto 0.5rem;width:fit-content"><a href="#" style="color:white;text-decoration:none">Terms</a><span style="color:white">|</span><a href="#" style="color:white;text-decoration:none">Privacy</a><span style="color:white">|</span><a href="#" style="color:white;text-decoration:none">Contact</a><span style="color:white">|</span><a href="#" style="color:white;text-decoration:none">Unsubscribe</a></div><p style="margin:0;color:white">© ${new Date().getFullYear()} Dofi Infosys</p></div>`;

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
    const userProfile = this.appSettingService.getDecryptedUserProfile();
		if(userProfile){
			this.userData = userProfile;
		}
  }

  initMailForm() {
    this.emailForm = this.fb.group({
      EmailTo: ['', [Validators.required, EmailValidators.multipleEmails()]],
      EmailCC: ['', [EmailValidators.multipleEmails()]],
      Subject: ['',[Validators.maxLength(500)]],
      Mailbody: ['',[Validators.maxLength(2000)]]
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

  removeFile(file: File) {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
  }

  saveForm() {
    if(this.emailForm.invalid){
      this.emailForm.markAllAsTouched();
      this.emailForm.updateValueAndValidity();
      this.appSettingService.showWarning('Please fill the required fields correctly');
      return;
    }
    this.emailSending = true;
    const CompanyMasterSid = this.userData.userBranchMaster[0]?.CompanyMasterSid;
    const BranchMasterSid = this.userData.userBranchMaster[0]?.BranchMasterSid;
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
}