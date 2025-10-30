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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';

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
  dummyFileUrl: string = 'assets/pdf-sample_0.pdf'; // place a PDF in src/assets
  existingFiles: any[] = []; // Files already in database

  
  @Input() screenName: string = "Edoc";
  @Output() closeModal = new EventEmitter<boolean>();
  @Input() dataItems: any[] = [];
  @Input() resetTrigger: boolean = false;
  @Input() formData: any = null;
  @Output() dataEmitter = new EventEmitter<any>();
  attachDocumentSid: any
  previewFileType: any
  edocform: FormGroup;
  minDate: NgbDateStruct;
  selectedFiles: File[] = [];
  currentCompany: any
  userData: any;
  currentBranch: any
  componentData: any
  attachedFiles: any[] = [];
  selectedFile: any = null;
  selectedFileUrl: SafeResourceUrl | any = '';
  existingFileName: string = '';

  // Client-side rendering properties
  excelData: any[][] = [];  // For Excel sheets
  excelSheets: string[] = []; // Sheet names
  activeSheetIndex: number = 0; // Currently displayed sheet
  wordHtmlContent: string = ''; // For Word documents
  constructor(
    private datePipe: CustomDatePipe,
    private sanitizer: DomSanitizer,

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
      FollowupRequired: [false], // ✅ boolean, not 'N'
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

  onFollowupChange(event: any) {
    this.edocform.patchValue({
      FollowupRequired: event.target.checked
    });
  }

  toggleYN(controlName: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    // Set value as 'Y' or 'N' based on checkbox state
    this.edocform.get(controlName)?.setValue(isChecked ? 'Y' : 'N');
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
    // Append NEW files only (existing files stay in database)
    if (this.selectedFiles && this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file) => {
        formData.append('files', file, file.name);
      });
      console.log('📤 Uploading new files:', this.selectedFiles.length);
    } else {
      console.log('ℹ️ No new files to upload');
    }
    // Convert FollowupDate to ISO string before appending to FormData
    if (formValue.FollowupDate) {
      formValue.FollowupDate = this.toUTCISO(formValue.FollowupDate);
    }

    formValue.FollowupRequired = formValue.FollowupRequired ? 'Y' : 'N';

    formData.append('CreatedBy', this.userData['userEmail']);

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
          if (res) {
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
          if (res) {
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
    this.existingFileName = null
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
  // formatFileSize(bytes: number): string {
  //   if (bytes === 0) return '0 Bytes';
  //   const k = 1024;
  //   const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  // }


// 2️⃣ Load existing files from API
loadEdocData() {
  const payload = {
    menuMasterSid: this.componentData.MenuMasterSid,
    DocumentSid: this.componentData.DocumentSid
  };

  this.commonService.getExistingFile(payload).subscribe(
    (response) => {
      console.log('🔍 Full API Response:', response);

      if (response.group && response.group.attachFiles) {
        this.existingFiles = response.group.attachFiles || [];
      } else if (response.attachDocument) {
        this.existingFiles = [response.attachDocument];
      }

      // Optional: load preview for the first file
      if (this.existingFiles.length > 0) {
        const firstFile = this.existingFiles[0];
        this.selectedFile = firstFile;
        this.attachDocumentSid = firstFile.AttachDocumentSid;
        this.loadFilePreview(firstFile);
        this.patchFormData(firstFile,response.group, response.followups?.[0]);
      }
    },
    (error) => {
      console.error('❌ Error loading Edoc data:', error);
      this.appSettingService.showError('Failed to load document data');
    }
  );
}

  // Load file preview from server
  loadFilePreview(file: any) {
    if (!file) return;

    const filePreviewPayload = {
      menuMasterSid: this.componentData.MenuMasterSid,
      documentSid: this.componentData.DocumentSid,
      fileName: file.FileName
    };

    const type = this.getFileType(file.FileName);
    this.previewFileType = type;

    // Reset previous content
    this.excelData = [];
    this.excelSheets = [];
    this.wordHtmlContent = '';

    // All files now return Blob for client-side rendering
    this.commonService.previewFile(filePreviewPayload).subscribe((res: Blob) => {
      console.log('📄 File response:', res);

      if (type === 'excel') {
        // Parse Excel client-side
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const arrayBuffer = e.target.result;
          this.parseExcelFile(arrayBuffer);
        };
        reader.readAsArrayBuffer(res);
        console.log('✅ Excel file loaded for parsing');

      } else if (type === 'doc') {
        // Parse Word client-side
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          const arrayBuffer = e.target.result;
          await this.parseWordFile(arrayBuffer);
        };
        reader.readAsArrayBuffer(res);
        console.log('✅ Word file loaded for parsing');

      } else {
        // PDF, Image, Text: use Blob URL
        const objectUrl = URL.createObjectURL(res);
        this.selectedFileUrl = objectUrl
        console.log('✅ Blob file preview loaded:', type);
      }

    }, (error) => {
      console.error('❌ Error loading file preview:', error);
      this.selectedFileUrl = this.dummyFileUrl;
    });
  }

  // Parse Excel file to HTML table data
  parseExcelFile(arrayBuffer: ArrayBuffer) {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      this.excelSheets = workbook.SheetNames;
      this.activeSheetIndex = 0;

      // Parse all sheets
      const allSheetsData: any = {};
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        allSheetsData[sheetName] = jsonData;
      });

      // Load first sheet by default
      if (this.excelSheets.length > 0) {
        this.excelData = allSheetsData[this.excelSheets[0]];
      }

      console.log('✅ Excel file parsed successfully', this.excelSheets.length, 'sheets');
    } catch (error) {
      console.error('❌ Error parsing Excel:', error);
      this.appSettingService.showError('Error parsing Excel file');
    }
  }

  // Parse Word document to HTML
  async parseWordFile(arrayBuffer: ArrayBuffer) {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
      this.wordHtmlContent = result.value; // HTML content

      if (result.messages.length > 0) {
        console.warn('Word conversion warnings:', result.messages);
      }

      console.log('✅ Word file parsed successfully');
    } catch (error) {
      console.error('❌ Error parsing Word:', error);
      this.appSettingService.showError('Error parsing Word file');
    }
  }

  // Switch between Excel sheets
  switchExcelSheet(sheetIndex: number) {
    this.activeSheetIndex = sheetIndex;
    const sheetName = this.excelSheets[sheetIndex];

    // Re-parse the selected sheet (you may want to cache this)
    const filePreviewPayload = {
      menuMasterSid: this.componentData.MenuMasterSid,
      documentSid: this.componentData.DocumentSid,
      fileName: this.selectedFile.FileName
    };

    this.commonService.previewFile(filePreviewPayload).subscribe((blob: Blob) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[sheetName];
        this.excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      };
      reader.readAsArrayBuffer(blob);
    });
  }

  getFileType(fileName: string): 'pdf' | 'excel' |'doc'| 'image' | 'text' | 'other' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'other';
    if (ext === 'pdf') return 'pdf';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) return 'image';
    if (['txt', 'log', 'csv'].includes(ext)) return 'text';
    return 'other';
  }


  // Patch form with file data
  patchFormData(fileData: any,res, followupData: any) {
    console.log(followupData)
    const fullFileName = fileData.FileName || '';
    const fileExt = fullFileName.includes('.')
      ? fullFileName.split('.').pop()?.toLowerCase()
      : fileData.DocumentType || '';
    const baseFileName = fullFileName.includes('.')
      ? fullFileName.substring(0, fullFileName.lastIndexOf('.'))
      : fullFileName;

    // Patch main document data
    this.edocform.patchValue({
      AttachDocmentNo: fileData.AttachDocmentNo || '',
      DocumentDate: fileData.DocumentDate || null,
      FileName: baseFileName || '',
      Documenttype: fileExt || '',
      ReceivedDate: fileData.ReceivedDate || null,
      SentDate: fileData.SentDate || null,
      FollowupRequired: fileData.FollowupRequire === 'Y',
      EdocRemarks: res.Remarks || '',
      EdocStatus: fileData.status || 'A',
      Public: fileData.Public || 'N',
      sentEmail: fileData.sentEmail || 'N',
    });

    // Patch followup data
    if (followupData) {
      this.edocform.patchValue({
        FollowupDate: followupData.FollowupDate || null,
        FollowupAction: followupData.FollowupAction || '',
        Public: followupData.Public || 'N',
        sentEmail: followupData.sentEmail || 'N',
        FollowupRemarks: followupData.Remarks || '',
        FollowupStatus: followupData.Status || 'A',
      });
    } else {
      this.edocform.patchValue({
        FollowupDate: null,
        FollowupAction: '',
        FollowupRemarks: '',
        FollowupStatus: 'A',
      });
    }

    this.edocform.updateValueAndValidity();
  }

  // Switch between multiple files
  selectFile(file: any) {
    this.selectedFile = file;
    this.attachDocumentSid = file.AttachDocumentSid;
    this.existingFileName = file.FileName;
    this.loadFilePreview(file);

    // Optionally update form with selected file's data
    // this.patchFormData(file, null);
  }

  // Download file
  downloadFile(file: any) {
    const payload = {
      menuMasterSid: this.componentData.MenuMasterSid,
      documentSid: this.componentData.DocumentSid,
      fileName: file.FileName
    };

    this.commonService.downloadFile(payload).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.FileName;
      link.click();
      window.URL.revokeObjectURL(url);
      console.log('✅ File downloaded:', file.FileName);
    }, (error) => {
      console.error('❌ Download error:', error);
      this.appSettingService.showError('Failed to download file');
    });
  }

  // Get file icon based on extension
  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'pdf': 'bi-file-pdf text-danger',
      'doc': 'bi-file-word text-primary',
      'docx': 'bi-file-word text-primary',
      'xls': 'bi-file-excel text-success',
      'xlsx': 'bi-file-excel text-success',
      'jpg': 'bi-file-image text-info',
      'jpeg': 'bi-file-image text-info',
      'png': 'bi-file-image text-info',
      'gif': 'bi-file-image text-info',
      'txt': 'bi-file-text text-secondary',
      'zip': 'bi-file-zip text-warning',
      'rar': 'bi-file-zip text-warning',
    };
    return iconMap[ext || ''] || 'bi-file-earmark text-secondary';
  }

  // Handle new file selection - ADD to existing files, don't replace
 onFileSelect(event: any) {
  const files = event.target.files;

  if (files && files.length > 0) {
    const newFiles = Array.from(files) as File[];

    // Avoid duplicates by file name
    this.selectedFiles = [
      ...this.selectedFiles,
      ...newFiles.filter(f => !this.selectedFiles.some(sf => sf.name === f.name))
    ];

    // Update form with FIRST newly selected file info (optional)
    const firstNewFile = newFiles[0];
    const fullFileName = firstNewFile.name;
    const fileNameOnly = fullFileName.substring(0, fullFileName.lastIndexOf('.')) || fullFileName;
    const extension = fullFileName.split('.').pop()?.toLowerCase();

    if (this.existingFiles.length === 0) {
      this.edocform.patchValue({
        FileName: fileNameOnly,
        Documenttype: extension
      });
    }

    event.target.value = ''; // reset input to allow re-selecting the same file
  }
}

  // Remove a newly selected file (before upload)
  removeSelectedFile(index: number) {
    this.selectedFiles.splice(index, 1);
    console.log('🗑️ Removed selected file. Remaining:', this.selectedFiles.length);
  }

  // Remove an existing file from database
  removeExistingFile(file: any, index: number) {
    if (confirm(`Are you sure you want to delete "${file.FileName}"?`)) {
      this.commonService.deleteEdocFile(file.AttachDocumentSid).subscribe(
        (res) => {
          if (res.status) {
            this.existingFiles.splice(index, 1);
            this.appSettingService.showSuccess('File deleted successfully');
            console.log('✅ File deleted:', file.FileName);
          } else {
            this.appSettingService.showError(res.message || 'Delete failed');
          }
        },
        (error) => {
          console.error('❌ Delete error:', error);
          this.appSettingService.showError('Failed to delete file');
        }
      );
    }
  }

  // Clear all newly selected files (not database files)
  clearSelectedFiles() {
    this.selectedFiles = [];
    console.log('🗑️ All selected files cleared');
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  closeTemplate() {
  if (this.activeModal) {
    this.activeModal.close(); 
  } else {
    this.closeModal.emit(true);
  }
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
