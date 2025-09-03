import { Component, EventEmitter, Output, Input, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef, NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { ExcelParserService } from 'src/app/modules/operation/booking/excel-parser.service';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-booking-upload',
  standalone: true,
  imports: [
    CommonModule,
    NgbAccordionModule // Add this for accordion functionality
  ],
  templateUrl: './booking-upload.component.html',
  styleUrl: './booking-upload.component.scss'
})
export class BookingUploadComponent {
  @Output() fileProcessed = new EventEmitter<any>();
  @Output() uploadError = new EventEmitter<string>();
  @Output() fileChanged = new EventEmitter<File | null>();
  @Input() acceptedFormats = '.xlsx,.xls';
  @Input() maxFileSize = 10 * 1024 * 1024; // 10MB
  departments: any[] = [];
  @Input()
  set departmentList(value: any[]) {
    if (value && value.length > 0) {
      this.departments = value;
    }
  }
  @ViewChild('uploadModalTemplate') uploadModalTemplate!: TemplateRef<any>;

  uploadModalRef!: NgbModalRef;
  selectedFile: File | null = null;
  isDragOver = false;
  isUploading = false;
  uploadSuccess = false;
  errorMessage: string | null = null;
  
  // New properties for booking selection
  showBookingSelection = false;
  parsedBookings: any[] = [];
  selectedBookingIndex: number | null = null;

  constructor(
    private ngbModal: NgbModal,
    private excelParserService: ExcelParserService,
    private appSettingService: AppSettingsService
  ) {}

  openModal(content?: TemplateRef<any>) {
    this.resetModalState();
    const template = content || this.uploadModalTemplate;
    this.uploadModalRef = this.ngbModal.open(template, {
      size: 'xl', // Changed to xl for better accordion display
      centered: true,
      backdrop: 'static'
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.setFile(file);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setFile(files[0]);
    }
  }

  setFile(file: File): void {
    this.errorMessage = null;
    this.uploadSuccess = false;

    if (!this.validateFile(file)) {
      return;
    }

    this.selectedFile = file;
    this.fileChanged.emit(this.selectedFile);
  }

  validateFile(file: File): boolean {
    const validExtensions = this.acceptedFormats.split(',').map(ext => ext.trim().toLowerCase());
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      this.errorMessage = `File "${file.name}" has invalid format. Supported formats: ${this.acceptedFormats}`;
      return false;
    }

    if (file.size > this.maxFileSize) {
      this.errorMessage = `File "${file.name}" is too large. Maximum size: ${this.getFileSize(this.maxFileSize)}`;
      return false;
    }

    return true;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.fileChanged.emit(null);
    this.errorMessage = null;
    this.uploadSuccess = false;
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.errorMessage = null;
    this.uploadSuccess = false;

    try {
      const file = this.selectedFile;

      if (this.isExcelFile(file)) {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
        const hasBookingSheets = workbook.SheetNames.includes('BookingHeader');

        if (hasBookingSheets) {
          const nestedBookingData = await this.excelParserService.parseExcelFile(file);

          // Check if multiple bookings exist
          if (nestedBookingData.length > 1) {
            this.parsedBookings = nestedBookingData;
            this.showBookingSelection = true;
            this.isUploading = false;
            this.uploadSuccess = false;
            return;
          } else {

            const processedData = {
              filename: file.name,
              size: file.size,
              type: 'excel',
              data: nestedBookingData,
              isMultiSheetStructure: true,
              dataType: 'bookings',
            };
            this.uploadSuccess = true;
            this.fileProcessed.emit(processedData);
            
            // Close modal after success
            setTimeout(() => {
              this.uploadModalRef.close(processedData);
            }, 1500);
          }
        } else {
          this.appSettingService.showWarning('Please provide a valid Excel file with BookingHeader sheet');
          this.uploadSuccess = false;
        }
      } else {
        this.appSettingService.showWarning('Please provide a file with accepted format');
        this.uploadSuccess = false;
      }

      this.isUploading = false;

    } catch (error) {
      console.error('Upload error:', error);
      this.isUploading = false;
      this.errorMessage = 'Failed to process Excel file. Please check that all required sheets exist with correct column names.';
      this.uploadError.emit(this.errorMessage);
    }
  }

  // New methods for booking selection
  selectBooking(index: number): void {
    this.selectedBookingIndex = index;
    this.errorMessage = null;
  }

  confirmBookingSelection(): void {
    if (this.selectedBookingIndex === null) {
      this.errorMessage = 'Please select a booking to proceed.';
      return;
    }

    const selectedBooking = this.parsedBookings[this.selectedBookingIndex];
    const processedData = {
      filename: this.selectedFile?.name,
      size: this.selectedFile?.size,
      type: 'excel',
      data: [selectedBooking], // Single booking in array
      isMultiSheetStructure: true,
      dataType: 'bookings',
      selectedBookingIndex: this.selectedBookingIndex,
      totalBookings: this.parsedBookings.length
    };

    this.uploadSuccess = true;
    this.showBookingSelection = false;

    this.fileProcessed.emit(processedData);

    // Close modal after success
    setTimeout(() => {
      this.uploadModalRef.close(processedData);
    }, 500);
  }

  cancelBookingSelection(): void {
    this.showBookingSelection = false;
    this.parsedBookings = [];
    this.selectedBookingIndex = null;
    this.errorMessage = null;
  }

  // Helper method to format POD display
  getPODDisplay(booking: any): string {
    const pod = booking?.POD || '';
    const fpod = booking?.FPD || '';
    
    if (fpod && fpod !== pod && fpod.trim() !== '') {
      return `${pod} → ${fpod}`;
    }
    return pod;
  }

  getDepartmentName(DepartmentMasterSid: any): string {
    if (!DepartmentMasterSid || !this.departments) return '';
    return (this.departments.find(d => d.DepartmentMasterSid === DepartmentMasterSid)?.departmentName || '');
  }

  getSegment(DepartmentMasterSid: any): string {
    if (!DepartmentMasterSid || !this.departments) return '';
    const department = this.departments.find(d => d.DepartmentMasterSid === DepartmentMasterSid);
    if(department?.departmentType === "Sea"){
      return department?.FCLLCL?.toUpperCase() || '';
    }
    return department?.departmentType?.toUpperCase() || '';
  }

  isExcelFile(file: File): boolean {
    const excelExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    return excelExtensions.includes(fileExtension);
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  }

  get hasFile(): boolean {
    return this.selectedFile !== null;
  }

  private resetModalState(): void {
    this.selectedFile = null;
    this.isDragOver = false;
    this.isUploading = false;
    this.uploadSuccess = false;
    this.errorMessage = null;
    // Reset booking selection state
    this.showBookingSelection = false;
    this.parsedBookings = [];
    this.selectedBookingIndex = null;
  }
}
