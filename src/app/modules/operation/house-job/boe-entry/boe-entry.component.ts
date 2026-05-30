import { Component, ViewChild, TemplateRef, Input, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, ElementRef, OnDestroy } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbDatepickerModule, NgbModal, NgbModalRef, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { OperationService } from '../../operation.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { catchError, firstValueFrom, forkJoin, of, Subscription } from 'rxjs';
import { FeatherModule } from 'angular-feather';
import { OnlyNumbersDirective } from 'src/app/core/Directives/onlyNumbersOfLength';
import { DecimalPrecisionDirective } from 'src/app/core/Directives/decimalWithPrecision';
import { TextWithNumbersDirective } from 'src/app/core/Directives/textWithNumbers';
import { CustomDatePipe } from 'src/app/core/pipes/custom-date-format.pipe';
import { NumberFormatPipe } from 'src/app/core/pipes/number-format.pipe';
import { ExcelExportService } from 'src/app/shared/excel-report-service';
import { SearchableDropdown } from 'src/app/component/searchable-dropdown/searchable-dropdown.component';
import { SearchableDropdownModal } from 'src/app/component/searchable-dropdown/searchable-dropdown-modal.component';
import { CurrencyConfigurationService } from 'src/app/core/services/currency-config.service';
import { CurrencyFormatService } from 'src/app/core/services/currency-format.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-boe-entry',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgSelectModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    FeatherModule,
    OnlyNumbersDirective,
    DecimalPrecisionDirective,
    TextWithNumbersDirective,
    NumberFormatPipe,
    SearchableDropdown,
    SearchableDropdownModal,
    NgxSpinnerModule,
    FormsModule,
    NgbTooltipModule,
    NgbDatepickerModule
  ],
  templateUrl: './boe-entry.component.html',
  styleUrls: ['./boe-entry.component.scss'],
  providers: [
    CustomDatePipe
  ]
})
export class BoeEntryComponent implements OnInit, OnChanges, OnDestroy {

  @Input() screenName: string;
  @Input() formData: any;
  @Input() resetTrigger: boolean = false;
  @Input() isFormDisabled: boolean = false;
  
  // Use only setter/getter for dataItems to avoid duplication
  private _dataItems: any[] = [];
  private dataItemsPatched = false;
  
  @Input()
  set dataItems(value: any[]) {
    this._dataItems = value || [];
    
    // Process dataItems when form is ready
    if (this.boeForm) {
      this.boeFormArray?.clear();
      this.page = 1;
      if (this._dataItems && this._dataItems.length > 0) {
        this.patchValues(this._dataItems);
      } else {
        this.updateBoePagination();
      }
      this.dataItemsPatched = true;
    }
  }
  
  get dataItems(): any[] {
    return this._dataItems;
  }
  
  @Output() dataEmitter = new EventEmitter<any[]>();
  @Output() validationResult = new EventEmitter<boolean>();
  @Output() reloadParent = new EventEmitter<any>();

  boeForm!: FormGroup;
  currentBoeIndex: number = -1;
  
  // Data management
  private prevValue: boolean;
  private boeValueChangesSub?: Subscription;
  private readonly requiredBoeFields = ['DeclarationNo', 'BOENo', 'TransactionType'];
  private readonly boeDateFields = ['BOEDate', 'ProcessDate', 'ReceivedDate', 'AckDate'];
  private readonly requiredBoeFieldLabels: Record<string, string> = {
    DeclarationNo: 'Declaration No',
    BOENo: 'BOE No',
    TransactionType: 'Transaction Type'
  };
  
  // Pagination
  boeDataLength: number = 0;
  page = 1;
  pageSize = 5;
  slicedBoeFormArray: any[] = [];

  // Lookup data
  currentCompany: any;
  currentBranch: any;
  userData: any;
  digitsAfterDecimal = 3;
  transactionTypeOptions = [
    { regimeType: 'Import', declarationType: 'Import to Local from ROW' },
    { regimeType: 'Import', declarationType: 'Import to Local from FZ' },
    { regimeType: 'Import', declarationType: 'Import to Local from CW' },
    { regimeType: 'Import', declarationType: 'Import Statistical Declaration' },
    { regimeType: 'Import', declarationType: 'Import for Re Exports to Local from ROW' },
    { regimeType: 'Import', declarationType: 'Import for Re Exports to Local from FZ' },
    { regimeType: 'Import', declarationType: 'Import for Re Exports to Local from CW' },
    { regimeType: 'Import', declarationType: 'Import to CW from ROW' },
    { regimeType: 'Import', declarationType: 'Import to CW from FZ' },
    { regimeType: 'Import', declarationType: 'Import to CW from Local(after temporary admission)' },
    { regimeType: 'Import', declarationType: 'Courier Import' },
    { regimeType: 'Import', declarationType: 'Import to Local After Temporary Admission' },
    { regimeType: 'Import', declarationType: 'Goods Consumption within FZ' },
    { regimeType: 'Export', declarationType: 'Export from Local to ROW' },
    { regimeType: 'Export', declarationType: 'Export from Local to FZ' },
    { regimeType: 'Export', declarationType: 'Export Statistical Declaration' },
    { regimeType: 'Export', declarationType: 'Temporary Export from Local to ROW' },
    { regimeType: 'Export', declarationType: 'Temporary Export from Local to FZ' },
    { regimeType: 'Export', declarationType: 'Export from CW to ROW' },
    { regimeType: 'Export', declarationType: 'Export from CW to FZ' },
    { regimeType: 'Export', declarationType: 'Re Export to ROW (after import for re export)' },
    { regimeType: 'Export', declarationType: 'Re Export to FZ (after import for Re Export)' },
    { regimeType: 'Export', declarationType: 'Return to FZ after Temporary Admission' },
    { regimeType: 'Export', declarationType: 'Return to ROW after Temporary Admission' },
    { regimeType: 'Export', declarationType: 'Courier Export' },
    { regimeType: 'Transit', declarationType: 'Transit (ROW to ROW)' },
    { regimeType: 'Transit', declarationType: 'FZ Transit in' },
    { regimeType: 'Transit', declarationType: 'FZ Transit Out' },
    { regimeType: 'Transit', declarationType: 'FZ Transit in from GCC and other Emirates FZ and GCC Local Market' },
    { regimeType: 'Transit', declarationType: 'FZ Transit Between Dubai Based FZ' },
    { regimeType: 'Transit', declarationType: 'Courier Transit' },
    { regimeType: 'Temporary Admission', declarationType: 'Temporary Admission from ROW to Local' },
    { regimeType: 'Temporary Admission', declarationType: 'Temporary Admission from FZ to Local' },
    { regimeType: 'Temporary Admission', declarationType: 'Temporary Admission from CW to Local' },
    { regimeType: 'Transfer', declarationType: 'Transfer of Cargo by Dubai based CW' },
    { regimeType: 'Transfer', declarationType: 'Transfer within a FZ' }
  ];

  transactionTypeLookupConfig = {
    displayFields: ['regimeType', 'declarationType'],
    displayLabels: ['Regime Type', 'Declaration Type'],
    labelFields: [ 'declarationType']
  };
  ackStatusOptions = ['Create', 'Approved', 'Rejected'];

  constructor(
    private fb: FormBuilder,
    private operationService: OperationService,
    private appSettingService: AppSettingsService,
    private spinner: NgxSpinnerService
  ) { 
    this.initBoeForm();
  }

  ngOnInit(): void {
    this.userData = this.appSettingService.getDecryptedUserProfile();
    this.currentCompany = this.appSettingService.decrypt(localStorage.getItem('selected-company'));
    this.currentBranch = this.appSettingService.decrypt(localStorage.getItem('selected-branch'));

    // If dataItems was not processed by the input setter, process it once here.
    if (!this.dataItemsPatched && this._dataItems && this._dataItems.length > 0) {
      this.patchValues(this._dataItems);
      this.dataItemsPatched = true;
    }
    this.subscribeBoeChanges();
    this.updateFormDisabledState();
  }

  ngOnDestroy(): void {
    this.boeValueChangesSub?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle reset trigger
    if (changes['resetTrigger'] && changes['resetTrigger'].currentValue !== this.prevValue) {
      this.prevValue = changes['resetTrigger'].currentValue;
      this.boeDataLength = 0;
      this.slicedBoeFormArray = [];
      this.boeFormArray.clear();
      this.page = 1;
      
      // Re-populate if we have data
      if (this._dataItems && this._dataItems.length > 0) {
        this.patchValues(this._dataItems);
      } else {
        this.updateBoePagination();
      }
    }

    // Handle formData changes
    if (changes['formData'] && this.formData) {
      this.setParentData(this.formData);
    }

    this.updateFormDisabledState();
  }

  private setParentData(value: any) {
    // Set parent data if needed
    console.log("Parent Value Changed", value);
  }

  private subscribeBoeChanges(): void {
    this.boeValueChangesSub?.unsubscribe();
    this.boeValueChangesSub = this.boeFormArray.valueChanges.subscribe(() => {
      this.dataEmitter.emit(this.getBoeData());
    });
  }

  // Form initialization
  initBoeForm() {
    this.boeForm = this.fb.group({
      boeFormArray: this.fb.array([])
    });
  }

  // Getter for form array
  get boeFormArray(): FormArray {
    return this.boeForm.get('boeFormArray') as FormArray;
  }

  // Create individual BOE form group
  createBoeFormGroup(data?: any): FormGroup {
    const ParentSid = data?.ParentSid || this.formData?.HouseJobSid;

    return this.fb.group({
      HouseJobBOESid: [data?.HouseJobBOESid || null],
      ParentSid: [ParentSid],
      CompanyMasterSid: [data?.CompanyMasterSid || this.currentCompany?.CompanyMasterSid],
      BranchMasterSid: [data?.BranchMasterSid || this.currentBranch?.BranchMasterSid],
      MenuMasterSid: [Number(sessionStorage.getItem('currentMenuId'))],
      
      DeclarationNo: [data?.DeclarationNo || '', [Validators.required]],
      BOENo: [data?.BOENo || '', [Validators.required]],
      BOEDate: [data?.BOEDate ? this.formatDate(data.BOEDate) : ''],
      BOEValue: [data?.BOEValue || null],
      BOEInvoiceValue: [data?.BOEInvoiceValue || ''],
      GrossWeight: [data?.GrossWeight || null],
      Volume: [data?.Volume || null],
      TransactionType: [data?.TransactionType || null, [Validators.required]],
      Amount: [data?.Amount || null],
      ProcessDate: [data?.ProcessDate ? this.formatDate(data.ProcessDate) : ''],
      ReceivedDate: [data?.ReceivedDate ? this.formatDate(data.ReceivedDate) : ''],
      AckNumber: [data?.AckNumber || ''],
      AckDate: [data?.AckDate ? this.formatDate(data.AckDate) : ''],
      AckStatus: [data?.AckStatus || ''],
      Remarks: [data?.Remarks || data?.Remarks || ''],
      
      status: [data?.status || 'Active'],
      CreatedBy: [data?.CreatedBy || this.userData?.userEmail],
      UpdatedBy: [data?.UpdatedBy || this.userData?.userEmail]
    });
  }

  // Format date for input
  formatDate(date: string | Date): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0];
  }

  // Patch values from input data
  patchValues(items: any[]) {
    console.log('Patching BOE values:', items);
    if (items && items.length > 0) {
      for (const item of items) {
        this.addBoeRow(item);
      }
    } else {
      this.addBoeRow();
    }
    this.updateBoePagination();
  }

  // Add new BOE row
  addBoeRow(data?: any) {
    if (this.isEffectiveFormDisabled && !data) {
      return;
    }
    // When adding a new row without data, populate it with parent form values
    if (!data && this.formData) {
      const ParentSid = this.formData?.HouseJobSid;
      data = {
        ParentSid: ParentSid,
        CompanyMasterSid: this.currentCompany?.CompanyMasterSid || null,
        BranchMasterSid: this.currentBranch?.BranchMasterSid || null
      };
    }

    const formGroup = this.createBoeFormGroup(data);
    this.boeFormArray.push(formGroup);
    if (!data?.HouseJobBOESid) {
      this.page = Math.ceil(this.boeFormArray.length / this.pageSize) || 1;
    }
    this.updateBoePagination();
    
    // Emit data changes
    this.dataEmitter.emit(this.getBoeData());
  }

  // Delete BOE row
  deleteBoe(index: number, HouseJobBOESid?: number) {
    if (this.isEffectiveFormDisabled) {
      return;
    }
    const formGroup = this.boeFormArray.at(index) as FormGroup;
    const updatedBy = this.appSettingService.userSettingSource.value['userEmail'];

    if (HouseJobBOESid) {
      this.operationService.deleteBoeById(HouseJobBOESid,updatedBy).subscribe({
        next: (resp: any) => {
          if (resp.status) {
            this.boeFormArray.removeAt(index);
            this.appSettingService.showSuccess("BOE Deleted Successfully");
            this.updateBoePagination();
            this.dataEmitter.emit(this.getBoeData());
          } else {
            this.appSettingService.showError(resp.message || 'Error deleting BOE');
          }
        },
        error: (error) => {
          this.appSettingService.showError(error?.error?.message || 'Error deleting BOE');
        }
      });
    } else {
      this.boeFormArray.removeAt(index);
      this.appSettingService.showSuccess("BOE Deleted Successfully");
      this.updateBoePagination();
      this.dataEmitter.emit(this.getBoeData());
    }
  }

  // Save BOE row
  saveBoe(index: number) {
    if (this.isEffectiveFormDisabled) {
      return;
    }
    const formGroup = this.boeFormArray.at(index) as FormGroup;
    
    if (formGroup.invalid) {
      formGroup.markAllAsTouched();
      this.appSettingService.showWarning('Please fill all required fields correctly.');
      return;
    }

    const value = this.normalizeBoePayload(formGroup.getRawValue());
    const houseJobSid = this.formData?.HouseJobSid;
    const companySid = this.formData?.CompanyMasterSid;

    if (!houseJobSid) {
      this.appSettingService.showWarning('House Job ID is missing — cannot save BOE');
      return;
    }

    const payload = {
      ...value,
      HouseJobSid: houseJobSid,
      CompanyMasterSid: companySid,
      CreatedBy: this.formData?.CreatedBy || this.userData?.userEmail,
      UpdatedBy: this.userData?.userEmail,
      Remarks: value.Remarks,
      AckNumber: value.AckNumber,
      Sno: index + 1
    };

    this.spinner.show();

    // Update existing BOE
    if (value.HouseJobBOESid) {
      this.operationService.updateBoeById(value.HouseJobBOESid, payload).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp.status) {
            this.appSettingService.showSuccess('BOE updated successfully');
            this.dataEmitter.emit(this.getBoeData());
          } else {
            this.appSettingService.showError(resp.message || 'Error updating BOE');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.appSettingService.showError('Error updating BOE');
          console.error('Error updating BOE:', err);
        }
      });
    } 
    // Create new BOE
    else {
      this.operationService.createBoe(payload).subscribe({
        next: (resp: any) => {
          this.spinner.hide();
          if (resp.status) {
            const created = resp?.data || resp;
            const newId = created?.HouseJobBOESid ?? null;

            if (newId) {
              formGroup.patchValue({ HouseJobBOESid: newId });
            }
            this.appSettingService.showSuccess('BOE created successfully');
            this.dataEmitter.emit(this.getBoeData());
          } else {
            this.appSettingService.showError(resp.message || 'Error creating BOE');
          }
        },
        error: (err) => {
          this.spinner.hide();
          this.appSettingService.showError('Error creating BOE');
          console.error('Error creating BOE:', err);
        }
      });
    }
  }

  // Validate BOE form array
  validateBoeArray(): boolean {
    if (!this.boeFormArray || this.boeFormArray.length === 0) {
      this.validationResult.emit(true); // Empty is valid
      return true;
    }

    for (let i = 0; i < this.boeFormArray.length; i++) {
      const boe = this.boeFormArray.at(i) as FormGroup;
      const boeValue = boe.getRawValue();

      if (!this.hasBoeValue(boeValue)) {
        continue;
      }

      const missingFields = this.requiredBoeFields.filter(field => !this.hasControlValue(boe.get(field)?.value));

      if (missingFields.length > 0) {
        boe.markAllAsTouched();
        const missingLabels = missingFields.map(field => this.requiredBoeFieldLabels[field]).join(', ');
        this.appSettingService.showWarning(
          `[SNo: ${i + 1}] Please fill required fields: ${missingLabels}.`
        );
        this.validationResult.emit(false);
        return false;
      }

      if (boe.invalid) {
        boe.markAllAsTouched();
        this.appSettingService.showError("Please fill all the required fields correctly");
        this.validationResult.emit(false);
        return false;
      }
    }

    this.validationResult.emit(true);
    return true;
  }

  // Pagination methods
  updateBoePagination() {
    this.boeDataLength = this.boeFormArray.length;
    const maxPage = Math.max(1, Math.ceil(this.boeDataLength / this.pageSize));
    this.page = Math.min(Math.max(this.page, 1), maxPage);
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.slicedBoeFormArray = this.boeFormArray.controls.slice(start, end);
  }

  onPageChange(page: number) {
    this.page = page;
    this.updateBoePagination();
  }

  // Check if BOE can be edited (always true for BOE)
  canEditBoe(index: number): boolean {
    return !this.isEffectiveFormDisabled;
  }
  getBoeData(): any[] {
  if (!this.boeFormArray) {
    return [];
  }

  return this.boeFormArray.getRawValue()
    .filter((boe: any) => this.hasBoeValue(boe))
    .map((boe: any) => this.normalizeBoePayload(boe));
}
validateBoeData(): boolean {
  return this.validateBoeArray();
}

  get isEffectiveFormDisabled(): boolean {
    return this.isFormDisabled || this.isSuspendedStatus(this.formData?.status);
  }

  private updateFormDisabledState(): void {
    if (!this.boeForm) {
      return;
    }
    if (this.isEffectiveFormDisabled) {
      this.boeForm.disable({ emitEvent: false });
    } else {
      this.boeForm.enable({ emitEvent: false });
    }
  }

  private isSuspendedStatus(status: any): boolean {
    const value = String(status ?? '').trim().toLowerCase();
    return value === 's' || value === 'suspended';
  }

  private hasBoeValue(boe: any): boolean {
    const fields = [
      'HouseJobBOESid',
      'DeclarationNo',
      'BOENo',
      'BOEDate',
      'BOEValue',
      'BOEInvoiceValue',
      'GrossWeight',
      'Volume',
      'TransactionType',
      'Amount',
      'ProcessDate',
      'ReceivedDate',
      'AckNumber',
      'AckDate',
      'AckStatus',
      'Remarks'
    ];

    return fields.some(field => {
      const value = boe?.[field];
      return this.hasControlValue(value);
    });
  }

  private hasControlValue(value: any): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  private normalizeBoePayload(boe: any): any {
    const payload = { ...boe };
    this.boeDateFields.forEach(field => {
      payload[field] = this.normalizeDateValue(payload[field]);
    });
    return payload;
  }

  private normalizeDateValue(value: any): string | null {
    if (!this.hasControlValue(value)) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (typeof value === 'object' && value.year && value.month && value.day) {
      const month = String(value.month).padStart(2, '0');
      const day = String(value.day).padStart(2, '0');
      return `${value.year}-${month}-${day}`;
    }

    return String(value);
  }
}
