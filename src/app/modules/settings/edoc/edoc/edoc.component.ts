import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Optional, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { FeatherModule } from 'angular-feather';
import { Subject } from 'rxjs';
import { CommonService } from 'src/app/common/common.service';
import { Status } from 'src/app/common/helper';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { NgxDocViewerModule } from "ngx-doc-viewer";
@Component({
  selector: 'app-edoc',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, NgbDatepickerModule, FeatherModule, NgxDocViewerModule],
  templateUrl: './edoc.component.html',
  styleUrl: './edoc.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class EdocComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
    dummyFileUrl: string = ' assets/pdf-sample_0.pdf'; // place a PDF in src/assets

  @Input() screenName: string = "Edoc";
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: boolean = false;
  @Input() formData: any = null;
  @Output() dataEmitter = new EventEmitter<any>();
  attachDocumentSid: any
  edocform: FormGroup;
  minDate: NgbDateStruct;
  selectedFiles: File[] | null = null;
  currentCompany: any
  userData: any;
  currentBranch: any
  componentData: any
    existingFileName: string | null = null; // ✅ Add this line
firstFile: File | null = null;
  firstFileUrl: string = '';
  constructor(
    private datePipe: CustomDatePipe,
    private route: ActivatedRoute, private commonService: CommonService, private fb: FormBuilder, private appSettingService: AppSettingsService, @Optional() public activeModal: NgbActiveModal,) {
    this.minDate = this.toNgbDateStruct(new Date())
  }


  ngOnInit() {
    this.userData = this.appSettingService.getDecryptedUserProfile();

    console.log('📂 Edoc modal opened!');
    console.log('📋 Received screenName:', this.screenName);
    console.log('📋 Received formData:', this.formData);
    console.log('📋 Received dataItems:', this.dataItems);
    this.componentData = this.commonService.documentData()
    console.log(this.componentData, ' this.componentData')
    this.initEdocForm()
    this.loadEdocData()
  }
  initEdocForm() {
    this.edocform = this.fb.group({
      AttachDocmentNo: ['', Validators.required],
      DocumentDate: ['', Validators.required],
      FileName: ['', Validators.required],
      Documenttype: ['', Validators.required],
      ReceivedDate: ['', Validators.required],
      SentDate: ['', Validators.required],
      FollowupRequired: ['N'],
      FollowupDate: [''],
      FollowupAction: [''],
      EdocRemarks: [''],
      FollowupRemarks: [''],
  EdocStatus: [Status.Active, Validators.required],      // ✅ Default "A"
      Public: ['N'],
      sentEmail: ['N'],
  FollowupStatus: [Status.Active],                       // ✅ Default "A"
      CompanyMasterSid: Number(this.componentData.CompanyMasterSid),
      BranchMasterSid: Number(this.componentData.BranchMasterSid),
      MenuMasterSid: Number(this.componentData.MenuMasterSid),
      DocumentSid: Number(this.componentData.DocumentSid)
    });
    this.edocform.get('FollowupRequired')?.valueChanges.subscribe((isChecked) => {
      const dateCtrl = this.edocform.get('FollowupDate');
      const actionCtrl = this.edocform.get('FollowupAction');
      const publicCtrl = this.edocform.get('Public');
      const emailCtrl = this.edocform.get('sentEmail');
      const remarksCtrl = this.edocform.get('FollowupRemarks');


      if (isChecked) {
        dateCtrl?.setValidators([Validators.required]);
        actionCtrl?.setValidators([Validators.required]);
      } else {
        dateCtrl?.clearValidators();
        actionCtrl?.clearValidators();
        dateCtrl?.setValue('');
        actionCtrl?.setValue('');
      }

      dateCtrl?.updateValueAndValidity();
      actionCtrl?.updateValueAndValidity();
    });
  }

  toggleYN(controlName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    // Set value as 'Y' or 'N' based on checkbox state
    this.edocform.get(controlName)?.setValue(isChecked ? 'Y' : 'N');
  }


loadEdocData() {
  const payload = {
    menuMasterSid: this.componentData.MenuMasterSid,
    DocumentSid: this.componentData.DocumentSid
  };

  this.commonService.getExistingFile(payload).subscribe((response) => {
    console.log('🔍 Full API Response:', response);
    
    if (response.attachDocument) {
      const res = response.attachDocument;
      const followup = response.followupResponse;
      
      this.attachDocumentSid = res.AttachDocumentSid;

      // Extract filename and extension
      const fullFileName = res.FileName || '';
      
      // Store existing filename for display
      this.existingFileName = fullFileName;
      
      const fileExt = fullFileName.includes('.') 
        ? fullFileName.split('.').pop()?.toLowerCase() 
        : res.Documenttype || '';
      
      const baseFileName = fullFileName.includes('.') 
        ? fullFileName.substring(0, fullFileName.lastIndexOf('.')) 
        : fullFileName;


      // Patch main document data
      // The CustomDateAdapter will automatically convert date strings to NgbDateStruct
      this.edocform.patchValue({
        AttachDocmentNo: res.AttachDocmentNo || '',
        DocumentDate: res.DocumentDate || null,  // Let adapter handle conversion
        FileName: baseFileName || '',
        Documenttype: fileExt || '',
        ReceivedDate: res.ReceivedDate || null,  // Let adapter handle conversion
        SentDate: res.SentDate || null,          // Let adapter handle conversion
        FollowupRequired: res.FollowupRequire,
        EdocRemarks: res.Remarks || '',
        EdocStatus: res.status || Status.Active,
        Public: res.Public || 'N',
        sentEmail: res.sentEmail || 'N',
      });

      // Patch followup data if present
      if (followup) {
        this.edocform.patchValue({
          FollowupDate: followup.FollowupDate || null,  // Let adapter handle conversion
          FollowupAction: followup.FollowupAction || '',
          Public: followup.Public || 'N',
          sentEmail: followup.sentEmail || 'N',
          FollowupRemarks: followup.Remarks || '',
          FollowupStatus: followup.Status || Status.Active,
        });

      } else {
        // Clear follow-up fields if no record exists
        this.edocform.patchValue({
          FollowupDate: null,
          FollowupAction: '',
          FollowupRemarks: '',
          FollowupStatus: Status.Active,
        });
        
        console.log('ℹ️ No followup data found');
      }
      // Force change detection
      this.edocform.updateValueAndValidity();
    } else {
      console.warn('⚠️ No attachDocument found in response');
    }
  }, (error) => {
    console.error('❌ Error loading Edoc data:', error);
    this.appSettingService.showError('Failed to load document data');
  });
}

// Helper method to debug form errors
getFormErrors(): any {
  const errors: any = {};
  Object.keys(this.edocform.controls).forEach(key => {
    const control = this.edocform.get(key);
    if (control && control.errors) {
      errors[key] = control.errors;
    }
  });
  return errors;
}
// Fixed onFileSelect method
onFileSelect(event: any) {
  const files = event.target.files;

  if (files && files.length > 0) {
    this.selectedFiles = Array.from(files);
    this.existingFileName = null; // ✅ Clear existing file when new files selected
    
    const firstFile = this.selectedFiles[0];
    const fullFileName = firstFile.name;
    const fileNameOnly = fullFileName.substring(0, fullFileName.lastIndexOf('.')) || fullFileName;
    const extension = fullFileName.split('.').pop()?.toLowerCase();

    console.log('📎 File selected:', {
      fullFileName,
      fileNameOnly,
      extension
    });

    this.edocform.patchValue({
      FileName: fileNameOnly,
      Documenttype: extension
    });

    console.log('✅ File info patched to form');
  }
}


  onSubmit() {
  const formValue = this.edocform.value;

  // ✅ CREATE mode (new record)
  if (!this.attachDocumentSid) {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.appSettingService.showError('Please select at least one file');
      return;
    }
  }


  // ✅ Prepare FormData
  const formData = new FormData();

  // Append selected files (only if new files exist)
  if (this.selectedFiles && this.selectedFiles.length > 0) {
    this.selectedFiles.forEach((file) => {
      formData.append('files', file, file.name);
    });
  }

  // Convert FollowupDate to ISO string before appending to FormData
if (formValue.FollowupDate) {
  formValue.FollowupDate = this.toUTCISO(formValue.FollowupDate);
}

formValue.FollowupRequired = formValue.FollowupRequired ? 'Y' : 'N';

formData.append('CreatedBy',this.userData['userEmail']);

  // Append form fields (non-empty values only)
  Object.keys(formValue).forEach(key => {
    const value = formValue[key];
    if (value !== null && value !== undefined && value !== '') {
      formData.append(key, value);
    }
  });

  // Emit to parent (optional)
  this.dataEmitter.emit({
    dataItems: [formValue],
    formData: this.selectedFiles
  });

  console.log('Uploading files...');

  // ✅ Update or Create API call
  if (this.attachDocumentSid) {
    // --- Update ---
    this.commonService.updateEdocById(this.attachDocumentSid, formData).subscribe(
      (res) => {
        if (res.status) {
          this.appSettingService.showSuccess(res.message || 'Edoc updated successfully');
          this.closeTemplate()
          this.resetForm();
        } else {
          this.appSettingService.showError(res.message || 'Edoc update failed');
          this.closeTemplate()
        }
      },
      (error) => {
        console.error('Upload error:', error);
        this.appSettingService.showError(error?.error?.message || 'Upload failed');
      }
    );
  } else {
    // --- Create ---
    this.commonService.createEdoc(formData).subscribe(
      (res) => {
        if (res.status) {
          this.appSettingService.showSuccess(res.message || 'Edoc created successfully');
          this.closeTemplate()
          this.resetForm();
        } else {
          this.appSettingService.showError(res.message || 'Edoc creation failed');
          this.closeTemplate()
        }
      },
      (error) => {
        console.error('Upload error:', error);
        this.appSettingService.showError(error?.error?.message || 'Upload failed');
      }
    );
  }
}


  resetForm() {
    this.existingFileName=null
    this.edocform.reset();
  }

  modeOfType = [
    { id: '1', name: 'pdf' },
    { id: '2', name: 'xlsx' },
    { id: '3', name: 'json' },
    { id: '4', name: 'text' },
    { id: '5', name: 'docx' },
  ];

  modeOfStatus = [
  { id: Status.Active, name: 'Active' },
  { id: Status.Suspended, name: 'Suspended' },
  { id: Status.Deleted, name: 'Deleted' },
];

  modeOfAction = [
    { id: '1', name: 'Internal followup' },
    { id: '2', name: 'External followup' },
  ];

  // closeModal(){
  //   this.activeModal.close();
  // }

// Fixed toNgbDateStruct to handle UTC dates properly
toNgbDateStruct(dateValue: string | Date | null | undefined): NgbDateStruct | null {
  if (!dateValue) return null;

  try {
    let year: number, month: number, day: number;
    
    if (typeof dateValue === 'string') {
      // For ISO string dates like "2025-10-15T00:00:00.000Z"
      // Parse manually to avoid timezone issues
      const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateMatch) {
        year = parseInt(dateMatch[1], 10);
        month = parseInt(dateMatch[2], 10);
        day = parseInt(dateMatch[3], 10);
      } else {
        // Fallback to Date parsing
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateValue);
          return null;
        }
        year = date.getUTCFullYear();
        month = date.getUTCMonth() + 1;
        day = date.getUTCDate();
      }
    } else if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        console.warn('Invalid Date object:', dateValue);
        return null;
      }
      year = dateValue.getUTCFullYear();
      month = dateValue.getUTCMonth() + 1;
      day = dateValue.getUTCDate();
    } else {
      console.warn('Unexpected date type:', typeof dateValue, dateValue);
      return null;
    }

    const result = { year, month, day };
    console.log('📅 Date conversion:', dateValue, '→', result);
    return result;
  } catch (error) {
    console.error('Error converting date:', dateValue, error);
    return null;
  }
}

// Additional helper methods for file handling
formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

clearExistingFile(): void {
  this.existingFileName = null;
  // User can now select a new file
  console.log('🗑️ Existing file cleared, ready for new upload');
}

  closeTemplate() {
    this.closeModal.emit(true);
  }

  toUTCISO(dateStruct: NgbDateStruct | string | Date | null): string | null {
  if (!dateStruct) return null;

  if (typeof dateStruct === 'string' || dateStruct instanceof Date) {
    return new Date(dateStruct).toISOString(); // for Date or string input
  }

  // If NgbDateStruct
  const { year, month, day } = dateStruct;
  const date = new Date(Date.UTC(year, month - 1, day)); // UTC midnight
  return date.toISOString();
}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

  }

}
