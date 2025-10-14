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
import { CommonService } from 'src/app/common/common.service';
import { CustomDateAdapter } from 'src/app/component/datepicker/custom-date-adapter';
import { CustomDateParserFormatter } from 'src/app/component/datepicker/custom-date-parser';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
@Component({
  selector: 'app-edoc',
  standalone: true,
  imports: [NgSelectModule, ReactiveFormsModule, CommonModule, NgbDatepickerModule, FeatherModule],
  templateUrl: './edoc.component.html',
  styleUrl: './edoc.component.scss',
  providers: [
    { provide: NgbDateAdapter, useClass: CustomDateAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
    CustomDatePipe
  ],
})
export class EdocComponent implements OnInit, OnDestroy {
  @Input() screenName: string = "Edoc";
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: boolean = false;
  @Input() formData: any = null;
  @Output() dataEmitter = new EventEmitter<any>();

  edocform: FormGroup;
  minDate: NgbDateStruct;
  selectedFiles: File[] | null = null;
  currentCompany: any
  userData: any;
  currentBranch: any
  componentData: any
  constructor(private route: ActivatedRoute, private commonService: CommonService, private fb: FormBuilder, private appSettingService: AppSettingsService, @Optional() public activeModal: NgbActiveModal,) {
    this.minDate = this.toNgbDateStruct(new Date())
  }


  ngOnInit() {
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
      FollowupRequired: [false],
      FollowupDate: [''],
      FollowupAction: [''],
      Remarks: [''],
      Status: ['', Validators.required],
      CompanyMasterSid: Number(this.componentData.CompanyMasterSid),
      BranchMasterSid: Number(this.componentData.BranchMasterSid),
      MenuMasterSid: Number(this.componentData.MenuMasterSid),
      DocumentSid: Number(this.componentData.DocumentSid)
    });
    this.edocform.get('FollowupRequired')?.valueChanges.subscribe((isChecked) => {
      const dateCtrl = this.edocform.get('FollowupDate');
      const actionCtrl = this.edocform.get('FollowupAction');

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

  existingFileName: string | null = null;

  loadEdocData() {
  const payload = {
    menuMasterSid: this.componentData.MenuMasterSid,
    DocumentSid: this.componentData.DocumentSid
  };

  this.commonService.getExistingFile(payload).subscribe((res) => {
    if (res) {
      console.log(res, 'getExistingFile');
      
      // Fix 1: Filter returns array, get first item
      const typeMatch = this.modeOfType.find(item => item.name === res.DocumentType);
      
      // Fix 2: Map status code to status name
      let statusValue = 'Active'; // default
      if (res.status === 'A' || res.status === 'Active') {
        statusValue = 'Active';
      } else if (res.status === 'S' || res.status === 'Suspended') {
        statusValue = 'Suspended';
      }
      
      // Fix 3: Correct field names to match form control names
      this.edocform.patchValue({
        AttachDocmentNo: res.AttachDocmentNo || '',
        DocumentDate: res.DocumentDate ? this.toNgbDateStruct(new Date(res.DocumentDate)) : '',
        FileName: res.FileName || '',           // ✅ Correct case
        Documenttype: typeMatch ? typeMatch.name : '',  // ✅ Correct case + use find()
        ReceivedDate: res.ReceivedDate ? this.toNgbDateStruct(new Date(res.ReceivedDate)) : '',
        SentDate: res.SentDate ? this.toNgbDateStruct(new Date(res.SentDate)) : '',
        FollowupRequired: res.FollowupRequire?.trim() === 'Y',
        FollowupDate: res.FollowupDate ? this.toNgbDateStruct(new Date(res.FollowupDate)) : '',
        FollowupAction: res.FollowupAction || '',
        Remarks: res.Remarks || '',
        Status: statusValue  // ✅ Map to correct status name
      });

      // Fix 4: Handle file display (if file path is available)
      // Note: You cannot programmatically set a file input, but you can show the filename
      if (res.FileName) {
        // Store the existing file info for display
        this.existingFileName = res.FileName;
        // Optionally, you can fetch and create a File object if you have the file URL
        // this.loadExistingFile(res.FileUrl);
      }
      
      console.log('Form patched successfully:', this.edocform.value);
    }
  });
}



  onSubmit() {
    // Validate files
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.appSettingService.showError('Please select at least one file');
      return;
    }

    const formValue = this.edocform.value;

    // Create FormData for file upload
    const formData = new FormData();
    // Append files
    this.selectedFiles.forEach((file) => {
      formData.append('files', file, file.name);
    });

    // Append other form fields only if they have values
    Object.keys(formValue).forEach(key => {
      const value = formValue[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    // Emit data to parent if needed
    this.dataEmitter.emit({
      dataItems: [formValue],
      formData: this.selectedFiles
    });

    console.log('Uploading files...');

    // Upload
    this.commonService.createEdoc(formData).subscribe(
      (res) => {
        if (res) {
          this.appSettingService.showSuccess(
            res.message || 'Edoc created successfully'
          );
          this.resetForm();
        } else {
          this.appSettingService.showError(
            res.message || 'Edoc creation failed'
          );
        }
      },
      (error) => {
        console.error('Upload error:', error);
        this.appSettingService.showError(
          error?.error?.message || 'Upload failed'
        );
      }
    );
  }






  onFileSelect(event: any) {
    const files = event.target.files;

    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);

      const firstFile = this.selectedFiles[0];

      // Full filename with extension
      const fullFileName = firstFile.name;

      // Extract filename without extension
      const fileNameOnly = fullFileName.substring(0, fullFileName.lastIndexOf('.')) || fullFileName;

      // Extract extension (optional)
      const extension = fullFileName.split('.').pop()?.toLowerCase();

      // Patch to form
      this.edocform.patchValue({
        Filename: fileNameOnly,
        DocumentType: extension
      });
    }
  }



  resetForm() {
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
    { id: '1', name: 'Active' },
    { id: '2', name: 'Suspended' },
  ];

  // closeModal(){
  //   this.activeModal.close();
  // }

  toNgbDateStruct(dateValue: string | Date | null | undefined): NgbDateStruct | null {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object, use it directly
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateValue);
      return null;
    }
    
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  } catch (error) {
    console.error('Error converting date:', dateValue, error);
    return null;
  }
}


  closeTemplate() {
    this.closeModal.emit(true);
  }

  ngOnDestroy(): void {

  }

}
